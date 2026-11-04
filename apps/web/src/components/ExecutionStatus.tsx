"use client";

import { useEffect, useRef, useState } from "react";
import { auroraFetch } from "@/lib/aurora-api";

const FAIL = /fail|error|refund|expire|cancel/i;
const DONE = /complete|success|settled|executed|done/i;

export function ExecutionStatus({
    address,
    executionId,
    title,
    onFinished,
  }: {
    address?: string | null;
    executionId?: string | null;
    title: string;
    onFinished?: () => void;
  }) {
    const [status, setStatus] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const finishedRef = useRef(onFinished);
    finishedRef.current = onFinished;

  useEffect(() => {
    setStatus(null);
    setErr(null);
    if (!address || !executionId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const j: any = await auroraFetch<any>(
          `/api/v1/executions/${address}?id=${executionId}`,
        );
        const r = j?.result ?? j;
        const item = Array.isArray(r) ? r[0] : r;
        console.log("Execution status payload:", item);
        const s = String(item?.status ?? item?.executionStatus ?? "UNKNOWN");
        if (stop) return;
        setStatus(s);
        setErr(null);
        if (FAIL.test(s) || DONE.test(s)) {
            finishedRef.current?.(); // let the page refresh balances
            return; // stop polling
          }
      } catch (e) {
        if (!stop) setErr(e instanceof Error ? e.message : String(e));
      }
      timer = setTimeout(tick, 10000);
    };
    void tick();

    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [address, executionId]);

  if (!executionId) return null;

  const failed = status != null && FAIL.test(status);
  const done = status != null && DONE.test(status);
  const color = failed ? "#ff6b6b" : done ? "#19b37e" : "#e0b84a";

  return (
    <div
      style={{
        border: `1px solid ${color}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <strong>{title}</strong>
      <span style={{ color }}>
        Status: {status ?? "checking…"}
      </span>
      {failed && (
        <span>
          This run did not complete. Check your wallet on Basescan for a
          returned deposit, and send the execution id below to Aurora support.
        </span>
      )}
      {done && <span>Completed. Check Solscan or Basescan for the result.</span>}
      {!failed && !done && status && (
        <span>In progress. This page updates every 10 seconds.</span>
      )}
      {err && <span style={{ opacity: 0.7 }}>Status check issue: {err}</span>}
      <span style={{ fontSize: 13, opacity: 0.7, wordBreak: "break-all" }}>
        Execution id: {executionId}
      </span>
    </div>
  );
}