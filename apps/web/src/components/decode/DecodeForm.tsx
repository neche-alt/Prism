"use client";

import { useEffect, useState } from "react";
import type { DiagnosticReport } from "@/lib/types";
import { useRecentFailures, type HistoryEntry } from "@/components/shared/RecentTransactions";

interface DecodeFormProps {
  onDecode: (report: DiagnosticReport | null) => void;
}

const SAMPLE_TX_HASH =
  "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

export default function DecodeForm({ onDecode }: DecodeFormProps) {
  const recentFailures: HistoryEntry[] = useRecentFailures();
  const [category, setCategory] = useState<string>("contract");
  const [code, setCode] = useState<string>("0");
  const [txHash, setTxHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pre-fill the hash from the URL when arriving from RecentTransactions
  // (navigates to /decode?txHash=...).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paramHash = params.get("txHash");
    if (paramHash) {
      setTxHash(paramHash);
      const match = recentFailures.find(
        (entry) => entry.txHash === paramHash
      );
      if (match) {
        setCategory(match.errorCategory.toLowerCase());
        setCode(String(match.report.error_code));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFailure = (entry: HistoryEntry) => {
    setTxHash(entry.txHash);
    setCategory(entry.errorCategory.toLowerCase());
    setCode(String(entry.report.error_code));
  };

  const mockDecode = (cat: string, codeVal: number): DiagnosticReport => {
    switch (cat.toLowerCase()) {
      case "contract":
        if (codeVal === 1) {
          return {
            error_category: "Contract",
            error_code: 1,
            error_name: "InternalError",
            summary:
              "An internal protocol implementation error occurred (e.g. invalid ledger state).",
            detailed_explanation:
              "The contract encountered an internal error during execution, indicating a protocol implementation issue or invalid ledger state.",
            severity: "error",
            root_causes: [
              {
                description:
                  "Internal validation or state consistency checks failed in the contract",
                likelihood: "high",
              },
            ],
            suggested_fixes: [
              {
                description:
                  "Check the diagnostic logs to see if there are internal contract assertion failures",
                difficulty: "medium",
                requires_upgrade: false,
              },
            ],
          };
        } else if (codeVal === 2) {
          return {
            error_category: "Contract",
            error_code: 2,
            error_name: "OperationNotSupportedError",
            summary:
              "The operation is not supported (e.g. calling clawback on an asset without clawback enabled).",
            detailed_explanation:
              "The contract attempted an operation that is unsupported by the contract configuration or type (e.g., performing a clawback on an asset when clawback is disabled).",
            severity: "error",
            root_causes: [
              {
                description: "Invoking clawback on a non-clawbackable asset",
                likelihood: "high",
              },
            ],
            suggested_fixes: [
              {
                description:
                  "Check the asset flags and ensure the operation is allowed for the target asset",
                difficulty: "easy",
                requires_upgrade: false,
              },
            ],
          };
        } else if (codeVal === 3) {
          return {
            error_category: "Contract",
            error_code: 3,
            error_name: "AlreadyInitializedError",
            summary:
              "The contract instance has already been initialized and cannot be re-initialized.",
            detailed_explanation:
              "The contract instance was initialized twice. Soroban contracts typically only allow initialization once.",
            severity: "error",
            root_causes: [
              {
                description:
                  "Calling the initialize function on an already initialized contract instance",
                likelihood: "high",
              },
            ],
            suggested_fixes: [
              {
                description:
                  "Ensure that initialization is only called once per contract deployment",
                difficulty: "easy",
                requires_upgrade: false,
              },
            ],
          };
        } else if (codeVal === 6) {
          return {
            error_category: "Contract",
            error_code: 6,
            error_name: "AccountMissingError",
            summary:
              "An account involved in the transaction does not exist on the network.",
            detailed_explanation:
              "The operation required a specific account to exist on the network, but the account could not be found.",
            severity: "error",
            root_causes: [
              {
                description:
                  "Providing an invalid account address or an account that has not been created/funded",
                likelihood: "high",
              },
            ],
            suggested_fixes: [
              {
                description:
                  "Verify that the addresses provided exist and are active on the target network",
                difficulty: "easy",
                requires_upgrade: false,
              },
            ],
          };
        } else {
          return {
            error_category: "Contract",
            error_code: codeVal,
            error_name: "ContractError",
            summary:
              "Contract error: the contract's own logic rejected this call — run with --resolve to map the code to its name.",
            detailed_explanation:
              "Unlike host errors, contract errors are defined by the contract author. Each contract can define an error enum with numeric codes and descriptive names. When a contract panics or returns an error value, the host wraps it as a ContractError with the numeric code.",
            severity: "error",
            root_causes: [
              {
                description: "Business logic assertion failure in the contract",
                likelihood: "high",
              },
            ],
            suggested_fixes: [
              {
                description:
                  "Review the contract source code for the error enum definition to understand the specific failure",
                difficulty: "medium",
                requires_upgrade: false,
              },
            ],
          };
        }

      case "budget":
        return {
          error_category: "Budget",
          error_code: codeVal,
          error_name: "CpuLimitExceeded",
          summary:
            "CPU limit exceeded: the transaction ran out of CPU instructions before completing execution.",
          detailed_explanation:
            "The transaction exceeded its CPU instruction budget. Each transaction has a fixed CPU budget limits defined by the protocol to prevent infinite loops.",
          severity: "fatal",
          root_causes: [
            {
              description:
                "Infinite loops or excessive complexity in contract execution path",
              likelihood: "high",
            },
          ],
          suggested_fixes: [
            {
              description: "Optimize contract code and reduce loop count",
              difficulty: "medium",
              requires_upgrade: false,
            },
          ],
        };

      default:
        return {
          error_category: cat.toUpperCase(),
          error_code: codeVal,
          error_name: "UnknownError",
          summary: `An unknown error occurred in category ${cat}.`,
          detailed_explanation:
            "This error code and category combination is not registered as a standard host error or contract error.",
          severity: "error",
          root_causes: [],
          suggested_fixes: [],
        };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const decodedReport = mockDecode(category, Number(code));
      onDecode(decodedReport);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="card-interactive bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-3xl mx-auto my-6 text-slate-100">
      <h2 className="text-xl font-bold tracking-tight text-violet-400 mb-4">
        🔎 Decode Error Code
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction hash + recent failures quick-fill */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transaction Hash{" "}
              <span className="text-slate-600 normal-case font-normal">
                (optional)
              </span>
            </label>
            <a
              href={`https://stellar.expert/explorer/?q=${encodeURIComponent(
                txHash
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Find a hash on Stellar Explorer ↗
            </a>
          </div>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder={`e.g. ${SAMPLE_TX_HASH}`}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          {recentFailures.length > 0 && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recent failures
              </label>
              <select
                value=""
                onChange={(e) => {
                  const entry = recentFailures.find(
                    (f) => f.id === e.target.value
                  );
                  if (entry) handleSelectFailure(entry);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="" disabled>
                  Select a recent failed transaction to autofill…
                </option>
                {recentFailures.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.txHash.slice(0, 10)}…
                    {entry.txHash.slice(-6)} · {entry.errorName} ·{" "}
                    {entry.network}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Error Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="contract">Contract (HostError::Contract)</option>
              <option value="budget">Budget (HostError::Budget)</option>
              <option value="storage">Storage (HostError::Storage)</option>
              <option value="auth">Auth (HostError::Auth)</option>
              <option value="value">Value (HostError::Value)</option>
              <option value="wasm">Wasm (HostError::Wasm)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Error Code (Numeric)
            </label>
            <input
              type="number"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1"
              min="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-press btn-pulse bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Decoding..." : "Diagnose Error"}
          </button>
        </div>
      </form>
    </div>
  );
}
