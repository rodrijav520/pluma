using CryptoExchangeGT.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CryptoExchangeGT.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public DbSet<Usuario> Usuarios { get; set; } = null!;
    public DbSet<WalletCustodia> WalletsCustodia { get; set; } = null!;
    public DbSet<Transaccion> Transacciones { get; set; } = null!;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entidad =>
        {
            entidad.HasKey(u => u.Id);
            entidad.Property(u => u.NombreCompleto).IsRequired().HasMaxLength(200);
            entidad.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entidad.HasIndex(u => u.Email).IsUnique();
            entidad.Property(u => u.PasswordHash).IsRequired().HasMaxLength(100);
            entidad.Property(u => u.SaldoGTQ).HasColumnType("decimal(18,2)");
            entidad.Property(u => u.Rol).HasConversion<int>();

            // Concurrencia optimista sobre el saldo. EF agrega Version al WHERE
            // de cada UPDATE, así que si otra operación modificó la fila entre
            // la lectura y la escritura, el UPDATE afecta 0 filas y EF lanza
            // DbUpdateConcurrencyException. Sin esto, dos compras simultáneas
            // podían gastar el mismo saldo dos veces.
            entidad.Property(u => u.Version).IsConcurrencyToken();
        });

        modelBuilder.Entity<WalletCustodia>(entidad =>
        {
            entidad.HasKey(w => w.Id);
            entidad.Property(w => w.DireccionPublica).IsRequired().HasMaxLength(42);
            entidad.Property(w => w.LlavePrivadaCifrada).IsRequired();
            entidad.Property(w => w.SaldoCriptoCacheado).HasColumnType("decimal(28,18)");
            entidad.HasIndex(w => w.UsuarioId).IsUnique();
            entidad.HasIndex(w => w.DireccionPublica).IsUnique();
            entidad.Property(w => w.Version).IsConcurrencyToken();

            entidad.HasOne<Usuario>()
                   .WithOne()
                   .HasForeignKey<WalletCustodia>(w => w.UsuarioId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transaccion>(entidad =>
        {
            entidad.HasKey(t => t.Id);
            entidad.Property(t => t.Tipo).HasConversion<int>();
            entidad.Property(t => t.Estado).HasConversion<int>();

            // 18 decimales cubre cualquier token ERC-20; el anterior (18,6)
            // truncaba silenciosamente los que usan más precisión.
            entidad.Property(t => t.MontoCripto).HasColumnType("decimal(28,18)");
            entidad.Property(t => t.MontoGTQ).HasColumnType("decimal(18,2)");
            entidad.Property(t => t.TasaCambioUsada).HasColumnType("decimal(18,6)");
            entidad.Property(t => t.DireccionDestino).HasMaxLength(42);
            entidad.Property(t => t.HashBlockchain).HasMaxLength(66);
            entidad.Property(t => t.MotivoFallo).HasMaxLength(500);
            entidad.Property(t => t.ReferenciaExterna).HasMaxLength(100);
            entidad.Property(t => t.Version).IsConcurrencyToken();

            // Historial paginado por usuario, ordenado por fecha descendente.
            entidad.HasIndex(t => new { t.UsuarioId, t.FechaCreacion });

            // El worker de confirmación filtra por estado.
            entidad.HasIndex(t => t.Estado);

            entidad.HasIndex(t => t.HashBlockchain);

            // Unicidad de la referencia externa: es lo que impide acreditar el
            // mismo depósito dos veces. El índice filtrado deja fuera los NULL,
            // que son la mayoría (solo los depósitos llevan referencia).
            entidad.HasIndex(t => t.ReferenciaExterna)
                   .IsUnique()
                   .HasFilter("\"ReferenciaExterna\" IS NOT NULL");

            entidad.HasOne<Usuario>()
                   .WithMany()
                   .HasForeignKey(t => t.UsuarioId)
                   .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
