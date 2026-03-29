import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Buildfi } from "../target/types/buildfi";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import {
  createMint,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("buildfi", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Buildfi as Program<Buildfi>;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  let usdcMint: Keypair;
  let usdcMintPk: PublicKey;

  /** Milestone with name (padded to 32 bytes), percentage (0-100), status, estimatedCompletion (i64). */
  function milestone(
    name: string,
    percentage: number,
    status = 0,
    estimatedCompletion: anchor.BN = new anchor.BN(0)
  ) {
    const nameBytes = Buffer.alloc(32);
    Buffer.from(name, "utf8").copy(nameBytes);
    return {
      name: Array.from(nameBytes),
      percentage,
      status,
      estimatedCompletion,
    };
  }

  function builderPda(ownerPk: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("builder"), ownerPk.toBuffer()],
      program.programId
    );
    return pda;
  }

  /** Trailing args for createProject (metadata + builder profile for first init). */
  type CreateProjectTailArgs = [
    string,
    string,
    number,
    string,
    string,
    string,
    anchor.BN,
    anchor.BN,
    string,
    string,
    string,
    string,
    string,
    anchor.BN,
    number,
    number,
  ];

  function defaultCreateProjectTail(): CreateProjectTailArgs {
    return [
      "Test Builder",
      "",
      0,
      "",
      "",
      "",
      new anchor.BN(0),
      new anchor.BN(0),
      "",
      "",
      "",
      "",
      "",
      new anchor.BN(0),
      0,
      0,
    ];
  }

  function projectAuthorityPda(projectPk: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("project_authority"), projectPk.toBuffer()],
      program.programId
    );
  }

  function vaultAddress(projectAuthority: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      usdcMintPk,
      projectAuthority,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  function buyerPda(projectPk: PublicKey, buyerPk: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("buyer"),
        projectPk.toBuffer(),
        buyerPk.toBuffer(),
      ],
      program.programId
    );
    return pda;
  }

  before(async () => {
    usdcMint = Keypair.generate();
    usdcMintPk = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      6,
      usdcMint
    );

    const ownerAta = getAssociatedTokenAddressSync(
      usdcMintPk,
      payer.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const createAtaIx = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ownerAta,
      payer.publicKey,
      usdcMintPk
    );
    try {
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(createAtaIx),
        [payer]
      );
    } catch {
      // Owner ATA may already exist
    }
    await mintTo(
      connection,
      payer,
      usdcMintPk,
      ownerAta,
      payer,
      1_000_000 * 1e6
    );
  });

  it("build and idl exist", () => {
    expect(program.programId).to.be.instanceOf(PublicKey);
    expect(program.idl).to.be.an("object");
    expect(program.idl.instructions).to.be.an("array");
    const names = program.idl.instructions.map((ix: { name: string }) => ix.name);
    expect(names).to.include("createProject");
    expect(names).to.include("deposit");
    expect(names).to.include("releaseCapital");
    expect(names).to.include("refund");
    expect(names).to.include("deleteProject");
    expect(names).to.include("initialize");
  });

  describe("initialize", () => {
    it("succeeds", async () => {
      await program.methods.initialize().accountsStrict({}).rpc();
    });
  });

  describe("createProject", () => {
    it("creates a project with valid milestones", async () => {
      const projectKp = Keypair.generate();
      const participationMintKp = Keypair.generate();
      const [projectAuthority] = projectAuthorityPda(projectKp.publicKey);
      const vault = vaultAddress(projectAuthority);

      const name = "Test Project";
      const description = "A test project";
      const fundingTarget = new anchor.BN(100_000 * 1e6);
      const milestones = [
        milestone("Milestone 1", 50),
        milestone("Milestone 2", 50),
      ];

      await program.methods
        .createProject(name, description, fundingTarget, milestones, ...defaultCreateProjectTail())
        .accountsStrict({
          owner: payer.publicKey,
          project: projectKp.publicKey,
          projectAuthority,
          vault,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      const project = await program.account.project.fetch(projectKp.publicKey);
      expect(project.owner.equals(payer.publicKey)).to.be.true;
      expect(project.name).to.equal(name);
      expect(project.description).to.equal(description);
      expect(project.fundingTarget.eq(fundingTarget)).to.be.true;
      expect(project.vault.equals(vault)).to.be.true;
      expect(project.participationMint.equals(participationMintKp.publicKey)).to.be.true;
      expect(project.milestoneCount).to.equal(2);
      expect(project.releasedMilestoneCount).to.equal(0);
    });

    it("fails when milestone percentages do not sum to 100", async () => {
      const projectKp = Keypair.generate();
      const participationMintKp = Keypair.generate();
      const [projectAuthority] = projectAuthorityPda(projectKp.publicKey);
      const vault = vaultAddress(projectAuthority);

      try {
        await program.methods
          .createProject(
            "Bad",
            "Bad project",
            new anchor.BN(1000),
            [milestone("M1", 30), milestone("M2", 30)],
            ...defaultCreateProjectTail()
          )
          .accountsStrict({
            owner: payer.publicKey,
            project: projectKp.publicKey,
            projectAuthority,
            vault,
            participationMint: participationMintKp.publicKey,
            usdcMint: usdcMintPk,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            builder: builderPda(payer.publicKey),
          })
          .signers([projectKp, participationMintKp])
          .rpc();
        throw new Error("Expected createProject to throw");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg).to.include("Milestone percentages must sum to 100");
      }
    });
  });

  describe("deposit", () => {
    let projectKp: Keypair;
    let projectPk: PublicKey;
    let participationMintPk: PublicKey;
    let projectAuthority: PublicKey;
    let vaultPk: PublicKey;
    let buyerKp: Keypair;
    let buyerUsdcAta: PublicKey;
    let buyerParticipationAta: PublicKey;

    before(async () => {
      projectKp = Keypair.generate();
      projectPk = projectKp.publicKey;
      const participationMintKp = Keypair.generate();
      participationMintPk = participationMintKp.publicKey;
      [projectAuthority] = projectAuthorityPda(projectPk);
      vaultPk = vaultAddress(projectAuthority);

      await program.methods
        .createProject(
          "Deposit Project",
          "For deposit tests",
          new anchor.BN(50_000 * 1e6),
          [milestone("Phase 1", 100)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintPk,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      buyerKp = Keypair.generate();
      await connection.requestAirdrop(buyerKp.publicKey, 5e9);
      await new Promise((r) => setTimeout(r, 1000));

      buyerUsdcAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const createBuyerUsdcIx = createAssociatedTokenAccountInstruction(
        buyerKp.publicKey,
        buyerUsdcAta,
        buyerKp.publicKey,
        usdcMintPk
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(createBuyerUsdcIx),
        [buyerKp]
      );
      await mintTo(connection, payer, usdcMintPk, buyerUsdcAta, payer, 10_000 * 1e6);

      buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintPk,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerParticipationAta,
            buyerKp.publicKey,
            participationMintPk
          )
        ),
        [buyerKp]
      );
    });

    it("deposits USDC and mints participation tokens", async () => {
      const amount = new anchor.BN(1_000 * 1e6);
      const buyerAccountPda = buyerPda(projectPk, buyerKp.publicKey);

      await program.methods
        .deposit(amount)
        .accountsStrict({
          buyer: buyerKp.publicKey,
          buyerAccount: buyerAccountPda,
          project: projectPk,
          vault: vaultPk,
          buyerUsdcAta,
          buyerParticipationAta,
          participationMint: participationMintPk,
          usdcMint: usdcMintPk,
          projectAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyerKp])
        .rpc();

      const vaultAccount = await getAccount(connection, vaultPk);
      expect(Number(vaultAccount.amount.toString())).to.equal(amount.toNumber());
      const participationAccount = await getAccount(connection, buyerParticipationAta);
      expect(Number(participationAccount.amount.toString())).to.equal(amount.toNumber());

      const projectAfter = await program.account.project.fetch(projectPk);
      expect(projectAfter.totalCapitalRaised.eq(amount)).to.be.true;

      const buyerAccount = await program.account.buyer.fetch(buyerAccountPda);
      expect(buyerAccount.user.equals(buyerKp.publicKey)).to.be.true;
      expect(buyerAccount.amount.eq(amount)).to.be.true;
    });

    it("fails when amount is zero", async () => {
      const buyerAccountPda = buyerPda(projectPk, buyerKp.publicKey);
      try {
        await program.methods
          .deposit(new anchor.BN(0))
          .accountsStrict({
            buyer: buyerKp.publicKey,
            buyerAccount: buyerAccountPda,
            project: projectPk,
            vault: vaultPk,
            buyerUsdcAta,
            buyerParticipationAta,
            participationMint: participationMintPk,
            usdcMint: usdcMintPk,
            projectAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyerKp])
          .rpc();
        throw new Error("Expected deposit to throw");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg).to.include("Invalid amount");
      }
    });
  });

  describe("releaseCapital", () => {
    let projectKp: Keypair;
    let projectPk: PublicKey;
    let participationMintKp: Keypair;
    let projectAuthority: PublicKey;
    let vaultPk: PublicKey;
    let ownerUsdcAta: PublicKey;

    before(async () => {
      projectKp = Keypair.generate();
      projectPk = projectKp.publicKey;
      participationMintKp = Keypair.generate();
      [projectAuthority] = projectAuthorityPda(projectPk);
      vaultPk = vaultAddress(projectAuthority);

      await program.methods
        .createProject(
          "Release Project",
          "For release tests",
          new anchor.BN(100_000 * 1e6),
          [milestone("First", 50), milestone("Second", 50)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      const buyerKp = Keypair.generate();
      await connection.requestAirdrop(buyerKp.publicKey, 5e9);
      await new Promise((r) => setTimeout(r, 1000));

      const buyerUsdcAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerUsdcAta,
            buyerKp.publicKey,
            usdcMintPk
          )
        ),
        [buyerKp]
      );
      await mintTo(connection, payer, usdcMintPk, buyerUsdcAta, payer, 10_000 * 1e6);

      const buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintKp.publicKey,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerParticipationAta,
            buyerKp.publicKey,
            participationMintKp.publicKey
          )
        ),
        [buyerKp]
      );

      await program.methods
        .deposit(new anchor.BN(10_000 * 1e6))
        .accountsStrict({
          buyer: buyerKp.publicKey,
          buyerAccount: buyerPda(projectPk, buyerKp.publicKey),
          project: projectPk,
          vault: vaultPk,
          buyerUsdcAta,
          buyerParticipationAta,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          projectAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyerKp])
        .rpc();

      ownerUsdcAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        payer.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    });

    it("releases first milestone to owner", async () => {
      const vaultBefore = await getAccount(connection, vaultPk);
      const ownerBefore = await getAccount(connection, ownerUsdcAta);

      await program.methods
        .releaseCapital()
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          ownerUsdcAta,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      const project = await program.account.project.fetch(projectPk);
      expect(project.releasedMilestoneCount).to.equal(1);

      const vaultAfter = await getAccount(connection, vaultPk);
      const ownerAfter = await getAccount(connection, ownerUsdcAta);
      const released = (Number(vaultBefore.amount) * 50) / 100;
      expect(Number(vaultAfter.amount)).to.equal(Number(vaultBefore.amount) - released);
      expect(Number(ownerAfter.amount) - Number(ownerBefore.amount)).to.equal(released);
    });

    it("fails when no milestone left to release", async () => {
      await program.methods.releaseCapital().accountsStrict({
        owner: payer.publicKey,
        project: projectPk,
        projectAuthority,
        vault: vaultPk,
        ownerUsdcAta,
        usdcMint: usdcMintPk,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([payer]).rpc();

      try {
        await program.methods.releaseCapital().accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          ownerUsdcAta,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([payer]).rpc();
        throw new Error("Expected releaseCapital to throw");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg).to.include("No milestone left to release");
      }
    });
  });

  describe("refund", () => {
    let projectKp: Keypair;
    let projectPk: PublicKey;
    let participationMintKp: Keypair;
    let projectAuthority: PublicKey;
    let vaultPk: PublicKey;
    let buyerKp: Keypair;
    let buyerUsdcAta: PublicKey;
    let buyerParticipationAta: PublicKey;
    let buyerAccountPda: PublicKey;

    before(async () => {
      projectKp = Keypair.generate();
      projectPk = projectKp.publicKey;
      participationMintKp = Keypair.generate();
      [projectAuthority] = projectAuthorityPda(projectPk);
      vaultPk = vaultAddress(projectAuthority);

      await program.methods
        .createProject(
          "Refund Project",
          "For refund tests",
          new anchor.BN(20_000 * 1e6),
          [milestone("Only", 100)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      buyerKp = Keypair.generate();
      await connection.requestAirdrop(buyerKp.publicKey, 5e9);
      await new Promise((r) => setTimeout(r, 1000));

      buyerUsdcAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerUsdcAta,
            buyerKp.publicKey,
            usdcMintPk
          )
        ),
        [buyerKp]
      );
      await mintTo(connection, payer, usdcMintPk, buyerUsdcAta, payer, 5_000 * 1e6);

      buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintKp.publicKey,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerParticipationAta,
            buyerKp.publicKey,
            participationMintKp.publicKey
          )
        ),
        [buyerKp]
      );
      buyerAccountPda = buyerPda(projectPk, buyerKp.publicKey);

      await program.methods
        .deposit(new anchor.BN(2_000 * 1e6))
        .accountsStrict({
          buyer: buyerKp.publicKey,
          buyerAccount: buyerAccountPda,
          project: projectPk,
          vault: vaultPk,
          buyerUsdcAta,
          buyerParticipationAta,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          projectAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyerKp])
        .rpc();
    });

    it("refunds buyer and burns participation tokens", async () => {
      const usdcBefore = await getAccount(connection, buyerUsdcAta);
      const depositAmount = 2_000 * 1e6;

      await program.methods
        .refund()
        .accountsStrict({
          buyer: buyerKp.publicKey,
          buyerAccount: buyerAccountPda,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          buyerUsdcAta,
          buyerParticipationAta,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyerKp])
        .rpc();

      const usdcAfter = await getAccount(connection, buyerUsdcAta);
      expect(Number(usdcAfter.amount) - Number(usdcBefore.amount)).to.equal(depositAmount);

      const buyerAccount = await program.account.buyer.fetch(buyerAccountPda);
      expect(buyerAccount.amount.toNumber()).to.equal(0);

      const participationAfter = await getAccount(connection, buyerParticipationAta);
      expect(Number(participationAfter.amount)).to.equal(0);
    });

    it("fails when a milestone has already been released", async () => {
      const projKp = Keypair.generate();
      const projPk = projKp.publicKey;
      const partMintKp = Keypair.generate();
      const [auth] = projectAuthorityPda(projPk);
      const v = vaultAddress(auth);

      await program.methods
        .createProject(
          "No Refund Project",
          "Release then refund",
          new anchor.BN(10_000 * 1e6),
          [milestone("A", 50), milestone("B", 50)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projPk,
          projectAuthority: auth,
          vault: v,
          participationMint: partMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projKp, partMintKp])
        .rpc();

      const bKp = Keypair.generate();
      await connection.requestAirdrop(bKp.publicKey, 5e9);
      await new Promise((r) => setTimeout(r, 1000));

      const bUsdc = getAssociatedTokenAddressSync(
        usdcMintPk,
        bKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(bKp.publicKey, bUsdc, bKp.publicKey, usdcMintPk)
        ),
        [bKp]
      );
      await mintTo(connection, payer, usdcMintPk, bUsdc, payer, 4_000 * 1e6);

      const bPart = getAssociatedTokenAddressSync(
        partMintKp.publicKey,
        bKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            bKp.publicKey,
            bPart,
            bKp.publicKey,
            partMintKp.publicKey
          )
        ),
        [bKp]
      );

      await program.methods
        .deposit(new anchor.BN(4_000 * 1e6))
        .accountsStrict({
          buyer: bKp.publicKey,
          buyerAccount: buyerPda(projPk, bKp.publicKey),
          project: projPk,
          vault: v,
          buyerUsdcAta: bUsdc,
          buyerParticipationAta: bPart,
          participationMint: partMintKp.publicKey,
          usdcMint: usdcMintPk,
          projectAuthority: auth,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bKp])
        .rpc();

      const ownerAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        payer.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await program.methods
        .releaseCapital()
        .accountsStrict({
          owner: payer.publicKey,
          project: projPk,
          projectAuthority: auth,
          vault: v,
          ownerUsdcAta: ownerAta,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      try {
        await program.methods
          .refund()
          .accountsStrict({
            buyer: bKp.publicKey,
            buyerAccount: buyerPda(projPk, bKp.publicKey),
            project: projPk,
            projectAuthority: auth,
            vault: v,
            buyerUsdcAta: bUsdc,
            buyerParticipationAta: bPart,
            participationMint: partMintKp.publicKey,
            usdcMint: usdcMintPk,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([bKp])
          .rpc();
        throw new Error("Expected refund to throw");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg).to.include("Refund not allowed after a milestone has been released");
      }
    });
  });

  describe("deleteProject", () => {
    it("deletes project when vault is empty", async () => {
      const projectKp = Keypair.generate();
      const projectPk = projectKp.publicKey;
      const participationMintKp = Keypair.generate();
      const [projectAuthority] = projectAuthorityPda(projectPk);
      const vaultPk = vaultAddress(projectAuthority);

      await program.methods
        .createProject(
          "To Delete",
          "Empty vault",
          new anchor.BN(5_000 * 1e6),
          [milestone("One", 100)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      await program.methods
        .deleteProject()
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintKp.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([payer])
        .rpc();

      try {
        await program.account.project.fetch(projectPk);
        throw new Error("Expected project account to be closed");
      } catch {
        // Account closed as expected
      }
    });

    it("fails when vault has balance", async () => {
      const projectKp = Keypair.generate();
      const projectPk = projectKp.publicKey;
      const participationMintKp = Keypair.generate();
      const [projectAuthority] = projectAuthorityPda(projectPk);
      const vaultPk = vaultAddress(projectAuthority);

      await program.methods
        .createProject(
          "No Delete Yet",
          "Has funds",
          new anchor.BN(5_000 * 1e6),
          [milestone("One", 100)],
          ...defaultCreateProjectTail()
        )
        .accountsStrict({
          owner: payer.publicKey,
          project: projectPk,
          projectAuthority,
          vault: vaultPk,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          builder: builderPda(payer.publicKey),
        })
        .signers([projectKp, participationMintKp])
        .rpc();

      const buyerKp = Keypair.generate();
      await connection.requestAirdrop(buyerKp.publicKey, 5e9);
      await new Promise((r) => setTimeout(r, 1000));

      const buyerUsdcAta = getAssociatedTokenAddressSync(
        usdcMintPk,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerUsdcAta,
            buyerKp.publicKey,
            usdcMintPk
          )
        ),
        [buyerKp]
      );
      await mintTo(connection, payer, usdcMintPk, buyerUsdcAta, payer, 1_000 * 1e6);

      const buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintKp.publicKey,
        buyerKp.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            buyerKp.publicKey,
            buyerParticipationAta,
            buyerKp.publicKey,
            participationMintKp.publicKey
          )
        ),
        [buyerKp]
      );

      await program.methods
        .deposit(new anchor.BN(100 * 1e6))
        .accountsStrict({
          buyer: buyerKp.publicKey,
          buyerAccount: buyerPda(projectPk, buyerKp.publicKey),
          project: projectPk,
          vault: vaultPk,
          buyerUsdcAta,
          buyerParticipationAta,
          participationMint: participationMintKp.publicKey,
          usdcMint: usdcMintPk,
          projectAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyerKp])
        .rpc();

      try {
        await program.methods
          .deleteProject()
          .accountsStrict({
            owner: payer.publicKey,
            project: projectPk,
            projectAuthority,
            vault: vaultPk,
            participationMint: participationMintKp.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([payer])
          .rpc();
        throw new Error("Expected deleteProject to throw");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg).to.include("Vault must be empty to delete project");
      }
    });
  });
});
