import type { Metadata } from "next";
import "./globals.css";
import CommandPalette from "@/components/shared/CommandPalette";
import KeyboardShortcutsHelp from "@/components/shared/KeyboardShortcutsHelp";

export const metadata: Metadata = {
  title: "Grat — Soroban Transaction Debugger",
  description:
    "From cryptic error to root cause in one command. Decode, trace, and debug Soroban transactions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <CommandPalette />
        <KeyboardShortcutsHelp />
      </body>
    </html>
  );
}
