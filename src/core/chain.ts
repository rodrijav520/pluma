import 'react-native-get-random-values';
import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  parseAbiItem,
  erc20Abi,
  type Address,
  type Hash,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';

/**
 * Red del MVP: Base Sepolia (testnet L2). Transacciones REALES en blockchain, dinero de prueba.
 * En mainnet (fase 2) el fee de un transfer de USDC en Base es < $0.01.
 */
export const CHAIN = baseSepolia;
export const CHAIN_ID = baseSepolia.id; // 84532

/** USDC oficial de Circle en Base Sepolia */
export const USDC_ADDRESS: Address = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const EXPLORER = 'https://sepolia.basescan.org';

const RPCS = [
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
  'https://base-sepolia.drpc.org',
];

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: fallback(
    RPCS.map((url) => http(url, { timeout: 12_000, retryCount: 1 })),
    { rank: false },
  ),
});

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

export type ChainTransfer = {
  hash: Hash;
  from: Address;
  to: Address;
  value: bigint;
  blockNumber: bigint;
};

export async function getUsdcBalance(address: Address): Promise<bigint> {
  return publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });
}

export async function getGasBalance(address: Address): Promise<bigint> {
  return publicClient.getBalance({ address });
}

export async function getBlockNumber(): Promise<bigint> {
  return publicClient.getBlockNumber();
}

/**
 * Busca transferencias de USDC hacia/desde `address` en [fromBlock, toBlock].
 * Los RPC públicos limitan el rango de getLogs → se consulta en trozos y,
 * si un trozo falla, se parte a la mitad (adaptativo).
 */
export async function fetchTransfers(
  address: Address,
  fromBlock: bigint,
  toBlock: bigint,
  maxChunks = 6,
): Promise<{ transfers: ChainTransfer[]; scannedTo: bigint }> {
  const transfers: ChainTransfer[] = [];
  let cursor = fromBlock;
  let chunkSize = 9_000n;
  let chunks = 0;

  while (cursor <= toBlock && chunks < maxChunks) {
    const end = cursor + chunkSize > toBlock ? toBlock : cursor + chunkSize;
    try {
      const [entrantes, salientes] = await Promise.all([
        publicClient.getLogs({
          address: USDC_ADDRESS,
          event: transferEvent,
          args: { to: address },
          fromBlock: cursor,
          toBlock: end,
        }),
        publicClient.getLogs({
          address: USDC_ADDRESS,
          event: transferEvent,
          args: { from: address },
          fromBlock: cursor,
          toBlock: end,
        }),
      ]);
      for (const log of [...entrantes, ...salientes]) {
        if (log.args.from == null || log.args.to == null || log.args.value == null) continue;
        transfers.push({
          hash: log.transactionHash,
          from: log.args.from,
          to: log.args.to,
          value: log.args.value,
          blockNumber: log.blockNumber,
        });
      }
      cursor = end + 1n;
      chunks++;
    } catch (e) {
      if (chunkSize <= 500n) throw e;
      chunkSize = chunkSize / 2n;
    }
  }

  return { transfers, scannedTo: cursor - 1n };
}

export async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
  const block = await publicClient.getBlock({ blockNumber });
  return Number(block.timestamp) * 1000;
}

/** Estimación simple del costo de gas de un transfer de USDC (en wei). */
export async function estimateTransferGasWei(from: Address): Promise<bigint> {
  const [gas, price] = await Promise.all([
    publicClient
      .estimateContractGas({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [from, 0n],
        account: from,
      })
      .catch(() => 80_000n),
    publicClient.getGasPrice(),
  ]);
  return gas * price * 2n; // margen 2x
}

export async function sendUsdc(mnemonic: string, to: Address, units: bigint): Promise<Hash> {
  const account = mnemonicToAccount(mnemonic);
  const wallet = createWalletClient({
    account,
    chain: CHAIN,
    transport: http(RPCS[0], { timeout: 20_000 }),
  });
  return wallet.writeContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, units],
  });
}

export async function waitForTx(hash: Hash): Promise<'ok' | 'reverted'> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  return receipt.status === 'success' ? 'ok' : 'reverted';
}

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function addrUrl(addr: string): string {
  return `${EXPLORER}/address/${addr}`;
}

/** URI EIP-681: la mayoría de wallets (Coinbase, MetaMask…) la escanean y pre-llenan el pago. */
export function eip681(to: Address, units?: bigint): string {
  const base = `ethereum:${USDC_ADDRESS}@${CHAIN_ID}/transfer?address=${to}`;
  return units && units > 0n ? `${base}&uint256=${units.toString()}` : base;
}
