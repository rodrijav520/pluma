using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CryptoExchangeGT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EsquemaSeguro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreCompleto = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    SaldoGTQ = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Rol = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Version = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Transacciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<int>(type: "INTEGER", nullable: false),
                    Estado = table.Column<int>(type: "INTEGER", nullable: false),
                    MontoCripto = table.Column<decimal>(type: "decimal(28,18)", nullable: false),
                    MontoGTQ = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TasaCambioUsada = table.Column<decimal>(type: "decimal(18,6)", nullable: false),
                    DireccionDestino = table.Column<string>(type: "TEXT", maxLength: 42, nullable: true),
                    HashBlockchain = table.Column<string>(type: "TEXT", maxLength: 66, nullable: true),
                    MotivoFallo = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ReferenciaExterna = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Compensada = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaConfirmacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Version = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transacciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transacciones_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WalletsCustodia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DireccionPublica = table.Column<string>(type: "TEXT", maxLength: 42, nullable: false),
                    LlavePrivadaCifrada = table.Column<string>(type: "TEXT", nullable: false),
                    SaldoCriptoCacheado = table.Column<decimal>(type: "decimal(28,18)", nullable: false),
                    GasPatrocinado = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaUltimaSincronizacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Version = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletsCustodia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletsCustodia_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_Estado",
                table: "Transacciones",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_HashBlockchain",
                table: "Transacciones",
                column: "HashBlockchain");

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_ReferenciaExterna",
                table: "Transacciones",
                column: "ReferenciaExterna",
                unique: true,
                filter: "\"ReferenciaExterna\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Transacciones_UsuarioId_FechaCreacion",
                table: "Transacciones",
                columns: new[] { "UsuarioId", "FechaCreacion" });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletsCustodia_DireccionPublica",
                table: "WalletsCustodia",
                column: "DireccionPublica",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletsCustodia_UsuarioId",
                table: "WalletsCustodia",
                column: "UsuarioId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Transacciones");

            migrationBuilder.DropTable(
                name: "WalletsCustodia");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
