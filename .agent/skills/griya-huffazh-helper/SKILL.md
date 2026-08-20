---
name: griya-huffazh-helper
description: Panduan khusus proyek Griya Huffazh Learn untuk agentic pair-programming, arsitektur TanStack Start, dan struktur UI.
---

# Griya Huffazh Helper Skill

Skill ini memberikan referensi cepat mengenai struktur arsitektur proyek **Griya Huffazh Learn**.

## 📌 Ringkasan Teknologi

- **Framework App:** TanStack Start (TypeScript, React 19, Vite)
- **Styling:** Tailwind CSS v4 & Lucide React icons
- **Form & Validation:** React Hook Form + Zod
- **Integration:** Lovable sync platform

## 📂 Struktur Utama Proyek

- `src/routes/` : Routing aplikasi berbasis TanStack Router
- `src/components/` : Komponen UI reusable (Button, Dialog, Form, dll.)
- `src/lib/` : Utility functions & helper
- `.agent/` : Sistem manajemen state, protocols, workflows, dan skills untuk AI Agent.

## 💡 Best Practices

1. Selalu periksa `package.json` sebelum menambahkan dependensi baru.
2. Gunakan `AGENT_STATE.md` untuk melacak perkembangan pekerjaan multi-step.
