import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Quiz de Engenharia de Dados", template: "%s · Quiz de Engenharia de Dados" },
  description: "Aprenda Engenharia de Dados com perguntas e explicações, do nível iniciante ao intermediário.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only rounded-md bg-accent px-4 py-2 text-accent-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10"
        >
          Pular para o conteúdo
        </a>
        <header className="border-b border-border bg-card">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2"
          >
            <Link href="/" className="flex min-h-11 items-center font-semibold tracking-tight">
              Quiz de Engenharia de Dados
            </Link>
            <Link href="/ranking" className="flex min-h-11 items-center rounded-md px-3 text-muted hover:text-foreground">
              Ranking
            </Link>
          </nav>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted">
          Feito para estudar Engenharia de Dados, do iniciante ao intermediário.
        </footer>
      </body>
    </html>
  );
}
