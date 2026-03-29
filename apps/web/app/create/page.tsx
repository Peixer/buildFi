"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "@/lib/program";
import {
  buildCreateProjectTx,
  type CreateProjectParams,
} from "@/lib/build-create-project-tx";
import { PRIVY_SOLANA_CHAIN, SOLANA_RPC_URL, USDC_MINT } from "@/lib/constants";
import { formatPrivyTransactionError } from "@/lib/privy-tx-error";

const MAX_NAME_LEN = 64;
const MAX_DESCRIPTION_LEN = 256;
const MAX_MILESTONES = 10;
const USDC_DECIMALS = 6;
const MAX_URL_LEN = 200;
const MAX_PROJECT_CODE_LEN = 32;
const MAX_LOCATION_LEN = 128;
const MAX_VISION_LEN = 512;
const MAX_THESIS_LEN = 256;
const PROJECT_STAGE_MAX = 10;
const RISK_LEVEL_MAX = 5;
const MILESTONE_STATUS_MAX = 2;

/** Fake CDN path for demo uploads (nothing is uploaded). */
const FAKE_IMAGE_URL_PREFIX = "https://cdn.buildfi.dev/placeholder/";

type MilestoneForm = {
  name: string;
  percentage: string;
  status: string;
  completionDate: string;
};

function dateInputToUnixSeconds(value: string): number {
  if (!value.trim()) return 0;
  const t = Date.parse(`${value}T12:00:00.000Z`);
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

function degreesToMicrodegrees(deg: number): string {
  if (!Number.isFinite(deg)) return "0";
  const n = Math.round(deg * 1_000_000);
  return String(n);
}

export default function CreatePage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fundingTargetUsdc, setFundingTargetUsdc] = useState("");
  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { name: "", percentage: "50", status: "0", completionDate: "" },
    { name: "", percentage: "50", status: "0", completionDate: "" },
  ]);
  const [builderName, setBuilderName] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [stage, setStage] = useState("0");
  const [projectCode, setProjectCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coverFileLabel, setCoverFileLabel] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [geoLatDeg, setGeoLatDeg] = useState("");
  const [geoLngDeg, setGeoLngDeg] = useState("");
  const [vision, setVision] = useState("");
  const [investmentThesis, setInvestmentThesis] = useState("");
  const [programRulesUrl, setProgramRulesUrl] = useState("");
  const [projectDocsUrl, setProjectDocsUrl] = useState("");
  const [milestonesDocsUrl, setMilestonesDocsUrl] = useState("");
  const [durationDays, setDurationDays] = useState("0");
  const [riskLevel, setRiskLevel] = useState("0");
  const [targetReturnBps, setTargetReturnBps] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    setMilestones((m) => [...m, { name: "", percentage: "", status: "0", completionDate: "" }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones((m) => m.filter((_, j) => j !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneForm, value: string) => {
    setMilestones((m) => m.map((x, j) => (j === i ? { ...x, [field]: value } : x)));
  };

  const onCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCoverFileLabel(null);
      return;
    }
    setCoverFileLabel(file.name);
    const fake = `${FAKE_IMAGE_URL_PREFIX}${encodeURIComponent(file.name)}`;
    setImageUrl(fake.length > MAX_URL_LEN ? fake.slice(0, MAX_URL_LEN) : fake);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!authenticated || !wallets[0]) {
      setError("Please connect your wallet.");
      return;
    }
    if (!USDC_MINT) {
      setError("NEXT_PUBLIC_USDC_MINT is not set. Configure it for your network.");
      return;
    }
    if (name.length > MAX_NAME_LEN) {
      setError(`Name must be at most ${MAX_NAME_LEN} characters.`);
      return;
    }
    if (description.length > MAX_DESCRIPTION_LEN) {
      setError(`Description must be at most ${MAX_DESCRIPTION_LEN} characters.`);
      return;
    }
    if (builderName.length > MAX_NAME_LEN) {
      setError(`Builder name must be at most ${MAX_NAME_LEN} characters.`);
      return;
    }
    if (builderDescription.length > MAX_DESCRIPTION_LEN) {
      setError(`Builder description must be at most ${MAX_DESCRIPTION_LEN} characters.`);
      return;
    }
    if (projectCode.length > MAX_PROJECT_CODE_LEN) {
      setError(`Project code must be at most ${MAX_PROJECT_CODE_LEN} characters.`);
      return;
    }
    if (imageUrl.length > MAX_URL_LEN) {
      setError(`Image URL must be at most ${MAX_URL_LEN} characters.`);
      return;
    }
    if (locationName.length > MAX_LOCATION_LEN) {
      setError(`Location must be at most ${MAX_LOCATION_LEN} characters.`);
      return;
    }
    if (vision.length > MAX_VISION_LEN) {
      setError(`Vision must be at most ${MAX_VISION_LEN} characters.`);
      return;
    }
    if (investmentThesis.length > MAX_THESIS_LEN) {
      setError(`Investment thesis must be at most ${MAX_THESIS_LEN} characters.`);
      return;
    }
    for (const u of [programRulesUrl, projectDocsUrl, milestonesDocsUrl]) {
      if (u.length > MAX_URL_LEN) {
        setError(`Each documentation URL must be at most ${MAX_URL_LEN} characters.`);
        return;
      }
    }
    const stageN = parseInt(stage, 10);
    if (isNaN(stageN) || stageN < 0 || stageN > PROJECT_STAGE_MAX) {
      setError(`Stage must be between 0 and ${PROJECT_STAGE_MAX}.`);
      return;
    }
    const riskN = parseInt(riskLevel, 10);
    if (isNaN(riskN) || riskN < 0 || riskN > RISK_LEVEL_MAX) {
      setError(`Risk level must be between 0 and ${RISK_LEVEL_MAX}.`);
      return;
    }
    const targetBps = parseInt(targetReturnBps, 10);
    if (isNaN(targetBps) || targetBps < 0 || targetBps > 65535) {
      setError("Target return (basis points) must be between 0 and 65535.");
      return;
    }
    const dur = parseInt(durationDays, 10);
    if (isNaN(dur) || dur < 0) {
      setError("Duration (days) must be a non-negative integer.");
      return;
    }

    const percentages = milestones.map((m) => parseInt(m.percentage, 10));
    if (percentages.some((p) => isNaN(p) || p <= 0)) {
      setError("Each milestone must have a positive percentage.");
      return;
    }
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      setError("Milestone percentages must sum to 100.");
      return;
    }
    for (let i = 0; i < milestones.length; i++) {
      const st = parseInt(milestones[i].status, 10);
      if (isNaN(st) || st < 0 || st > MILESTONE_STATUS_MAX) {
        setError(`Milestone ${i + 1}: status must be 0–${MILESTONE_STATUS_MAX}.`);
        return;
      }
    }
    const fundingTarget = parseFloat(fundingTargetUsdc);
    if (isNaN(fundingTarget) || fundingTarget <= 0) {
      setError("Funding target must be a positive number (USDC).");
      return;
    }
    const fundingTargetLamports = Math.round(fundingTarget * 10 ** USDC_DECIMALS);

    const lat = geoLatDeg.trim() === "" ? 0 : parseFloat(geoLatDeg);
    const lng = geoLngDeg.trim() === "" ? 0 : parseFloat(geoLngDeg);
    if (geoLatDeg.trim() !== "" && !Number.isFinite(lat)) {
      setError("Latitude must be a valid number (decimal degrees).");
      return;
    }
    if (geoLngDeg.trim() !== "" && !Number.isFinite(lng)) {
      setError("Longitude must be a valid number (decimal degrees).");
      return;
    }

    setSubmitting(true);
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const program = getProgram(connection);
      const owner = new PublicKey(wallets[0].address);
      const usdcMint = new PublicKey(USDC_MINT);

      const params: CreateProjectParams = {
        name: name.trim(),
        description: description.trim(),
        fundingTargetLamports,
        milestones: milestones.map((m) => ({
          name: m.name.trim() || "Milestone",
          percentage: parseInt(m.percentage, 10),
          status: parseInt(m.status, 10),
          estimatedCompletion: dateInputToUnixSeconds(m.completionDate),
        })),
        builderName: builderName.trim() || "Builder",
        builderDescription: builderDescription.trim(),
        stage: stageN,
        projectCode: projectCode.trim(),
        imageUrl: imageUrl.trim(),
        locationName: locationName.trim(),
        geoLat: degreesToMicrodegrees(lat),
        geoLng: degreesToMicrodegrees(lng),
        vision: vision.trim(),
        investmentThesis: investmentThesis.trim(),
        programRulesUrl: programRulesUrl.trim(),
        projectDocsUrl: projectDocsUrl.trim(),
        milestonesDocsUrl: milestonesDocsUrl.trim(),
        durationDays: dur,
        riskLevel: riskN,
        targetReturnBps: targetBps,
      };

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const { tx, projectKp } = await buildCreateProjectTx(
        program,
        owner,
        usdcMint,
        params,
        blockhash
      );

      const serialized = tx.serialize();
      await signAndSendTransaction({
        transaction: serialized,
        wallet: wallets[0],
        chain: PRIVY_SOLANA_CHAIN,
      });

      const projectAddress = projectKp.publicKey.toBase58();
      router.push(`/project/${projectAddress}`);
    } catch (err) {
      setError(formatPrivyTransactionError(err) || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-zinc-600 dark:text-zinc-400">
            You need to log in to create a project.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create project
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Add a new construction project to BuildFi. You will be the owner.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Basics</h2>
            <div>
              <label htmlFor="name" className={labelClass}>
                Project name
              </label>
              <input
                id="name"
                type="text"
                maxLength={MAX_NAME_LEN}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500">{name.length}/{MAX_NAME_LEN}</p>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={MAX_DESCRIPTION_LEN}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500">{description.length}/{MAX_DESCRIPTION_LEN}</p>
            </div>

            <div>
              <label htmlFor="funding" className={labelClass}>
                Funding target (USDC)
              </label>
              <input
                id="funding"
                type="number"
                min="1"
                step="any"
                value={fundingTargetUsdc}
                onChange={(e) => setFundingTargetUsdc(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Builder profile</h2>
            <p className="text-sm text-zinc-500">
              Stored on-chain as your builder PDA (created automatically on first project).
            </p>
            <div>
              <label htmlFor="builderName" className={labelClass}>
                Builder name
              </label>
              <input
                id="builderName"
                type="text"
                maxLength={MAX_NAME_LEN}
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="builderDescription" className={labelClass}>
                Builder description
              </label>
              <textarea
                id="builderDescription"
                rows={2}
                maxLength={MAX_DESCRIPTION_LEN}
                value={builderDescription}
                onChange={(e) => setBuilderDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Project details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="stage" className={labelClass}>
                  Stage (0–{PROJECT_STAGE_MAX})
                </label>
                <input
                  id="stage"
                  type="number"
                  min={0}
                  max={PROJECT_STAGE_MAX}
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectCode" className={labelClass}>
                  Project code
                </label>
                <input
                  id="projectCode"
                  type="text"
                  maxLength={MAX_PROJECT_CODE_LEN}
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <span className={labelClass}>Cover image (demo)</span>
              <p className="mt-1 text-xs text-zinc-500">
                No file is uploaded. We only set a placeholder URL on-chain for the filename you pick.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={onCoverFileChange}
                className="mt-2 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-700 dark:file:text-zinc-100"
              />
              {coverFileLabel && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Selected: {coverFileLabel}
                  {imageUrl && (
                    <>
                      {" "}
                      → URL preview: <span className="break-all">{imageUrl}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="locationName" className={labelClass}>
                Location name
              </label>
              <input
                id="locationName"
                type="text"
                maxLength={MAX_LOCATION_LEN}
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="geoLat" className={labelClass}>
                  Latitude (decimal degrees, optional)
                </label>
                <input
                  id="geoLat"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 40.7128"
                  value={geoLatDeg}
                  onChange={(e) => setGeoLatDeg(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="geoLng" className={labelClass}>
                  Longitude (decimal degrees, optional)
                </label>
                <input
                  id="geoLng"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. -74.006"
                  value={geoLngDeg}
                  onChange={(e) => setGeoLngDeg(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="vision" className={labelClass}>
                Vision
              </label>
              <textarea
                id="vision"
                rows={3}
                maxLength={MAX_VISION_LEN}
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="thesis" className={labelClass}>
                Investment thesis
              </label>
              <textarea
                id="thesis"
                rows={2}
                maxLength={MAX_THESIS_LEN}
                value={investmentThesis}
                onChange={(e) => setInvestmentThesis(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="rulesUrl" className={labelClass}>
                Program rules URL
              </label>
              <input
                id="rulesUrl"
                type="url"
                maxLength={MAX_URL_LEN}
                value={programRulesUrl}
                onChange={(e) => setProgramRulesUrl(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="docsUrl" className={labelClass}>
                Project documentation URL
              </label>
              <input
                id="docsUrl"
                type="url"
                maxLength={MAX_URL_LEN}
                value={projectDocsUrl}
                onChange={(e) => setProjectDocsUrl(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="milestonesDocsUrl" className={labelClass}>
                Milestones documentation URL
              </label>
              <input
                id="milestonesDocsUrl"
                type="url"
                maxLength={MAX_URL_LEN}
                value={milestonesDocsUrl}
                onChange={(e) => setMilestonesDocsUrl(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="durationDays" className={labelClass}>
                  Duration (days)
                </label>
                <input
                  id="durationDays"
                  type="number"
                  min={0}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="riskLevel" className={labelClass}>
                  Risk (0–{RISK_LEVEL_MAX})
                </label>
                <input
                  id="riskLevel"
                  type="number"
                  min={0}
                  max={RISK_LEVEL_MAX}
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="targetBps" className={labelClass}>
                  Target return (bps)
                </label>
                <input
                  id="targetBps"
                  type="number"
                  min={0}
                  max={65535}
                  value={targetReturnBps}
                  onChange={(e) => setTargetReturnBps(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Milestones (percentages must sum to 100)
              </h2>
              {milestones.length < MAX_MILESTONES && (
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Add milestone
                </button>
              )}
            </div>
            <ul className="space-y-4">
              {milestones.map((m, i) => (
                <li key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="min-w-[140px] flex-1">
                      <label className="text-xs text-zinc-500">Name</label>
                      <input
                        type="text"
                        placeholder="Milestone name"
                        value={m.name}
                        onChange={(e) => updateMilestone(i, "name", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-zinc-500">%</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="%"
                        value={m.percentage}
                        onChange={(e) => updateMilestone(i, "percentage", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs text-zinc-500">Status</label>
                      <select
                        value={m.status}
                        onChange={(e) => updateMilestone(i, "status", e.target.value)}
                        className={inputClass}
                      >
                        <option value="0">Pending</option>
                        <option value="1">Active</option>
                        <option value="2">Completed</option>
                      </select>
                    </div>
                    <div className="min-w-[160px] flex-1">
                      <label className="text-xs text-zinc-500">Est. completion (optional)</label>
                      <input
                        type="date"
                        value={m.completionDate}
                        onChange={(e) => updateMilestone(i, "completionDate", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "Creating…" : "Create project"}
            </button>
            <Link
              href="/explore"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
