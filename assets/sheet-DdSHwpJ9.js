import{r as e}from"./rolldown-runtime-hePW80VL.js";import{a as t,h as n,m as r,r as i}from"./button-CFHvP6kr.js";import{$ as a,At as o,Dt as s,Et as c,G as l,J as u,Mt as d,Ot as f,jt as p,kt as m,qt as h,tt as g}from"./card--L186gbZ.js";function _(e,t,n){let r=new Blob([e],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i)}function v(e){return e==null?`""`:`"${String(e).replace(/"/g,`""`)}"`}function y(e){_(`﻿`+[[`ID`,`Nama Guru`,`Username`,`Gender`,`Role`,`Jabatan`,`Spesialisasi`,`Level Target`,`No HP`,`Status`,`Tanggal Bergabung`,`Created At`,`Updated At`].join(`,`),...e.map(e=>[v(e.id),v(e.name),v(e.username||``),v(e.gender),v(e.role||`teacher`),v(e.position||``),v(e.specialization||``),v(e.level),v(e.phone||``),v(e.status),v(e.joinedAt),v(e.createdAt),v(e.updatedAt)].join(`,`))].join(`
`),`1_teachers_ghq_${new Date().toISOString().slice(0,10)}.csv`,`text/csv;charset=utf-8;`)}function b(e,t){_(`﻿`+[[`ID`,`Tanggal`,`ID Guru Dinilai`,`Nama Guru Dinilai`,`ID Mustami`,`Nama Mustami`,`Materi`,`Rincian Materi`,`Referensi Ayat/Halaman`,`Nilai Grade`,`PR/Tugas`,`Status PR`,`Catatan Mustami`,`Status Laporan`,`Created At`,`Updated At`].join(`,`),...e.filter(e=>!e.isDeleted).map(e=>{let n=g(t,e.teacherId),r=u[e.material]||e.material,i=a[e.status]||e.status,o=e.homework?e.homeworkDone?`PR Selesai`:`PR Belum Selesai`:`Tidak Ada PR`;return[v(e.id),v(e.date),v(e.teacherId),v(n),v(e.mustamiId),v(e.mustamiName),v(r),v(e.materialDetail),v(e.reference),v(e.grade),v(e.homework||``),v(o),v(e.mustamiNote||``),v(i),v(e.createdAt),v(e.updatedAt)].join(`,`)})].join(`
`),`2_reports_ghq_${new Date().toISOString().slice(0,10)}.csv`,`text/csv;charset=utf-8;`)}function x(e,t){_(`﻿`+[[`ID`,`ID Guru`,`Nama Guru`,`Judul Target`,`Deskripsi`,`Periode`,`Status`,`Target Value`,`Current Value`,`Satuan`,`Tanggal Mulai`,`Tenggat (Due Date)`,`Created By`,`Created At`,`Updated At`].join(`,`),...e.filter(e=>!e.isDeleted).map(e=>{let n=g(t,e.teacherId);return[v(e.id),v(e.teacherId),v(n),v(e.title),v(e.description||``),v(e.period),v(e.status),e.targetValue,e.currentValue,v(e.unit),v(e.startDate),v(e.dueDate),v(e.createdBy||``),v(e.createdAt),v(e.updatedAt)].join(`,`)})].join(`
`),`3_targets_ghq_${new Date().toISOString().slice(0,10)}.csv`,`text/csv;charset=utf-8;`)}function S(e,t){let n=window.open(``,`_blank`);if(!n)return;let r=`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Lembar Evaluasi Setoran Upgrading - Griya Huffazh Quran</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #0f766e; font-size: 22px; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .grade-box { display: inline-block; background: #0f766e; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 16px; }
        .section-title { font-size: 13px; font-weight: bold; color: #0f766e; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
        .sig-box { width: 200px; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GRIYA HUFFAZH QURAN</h1>
        <p>Lembar Evaluasi Upgrading Hafalan & Studi Pengajar</p>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Guru Yang Dinilai</div>
          <div class="value">${t}</div>
        </div>
        <div class="card">
          <div class="label">Mustami' (Penyimak)</div>
          <div class="value">${e.mustamiName}</div>
        </div>
        <div class="card">
          <div class="label">Tanggal Setoran</div>
          <div class="value">${l(e.date)}</div>
        </div>
        <div class="card">
          <div class="label">Nilai / Predikat</div>
          <div class="value"><span class="grade-box">Nilai ${e.grade}</span></div>
        </div>
      </div>

      <div class="section-title">Rincian Materi Setoran</div>
      <div class="card" style="margin-bottom: 15px;">
        <div class="value">${e.materialDetail}</div>
        <div style="font-size: 13px; color: #475569;">Referensi: ${e.reference}</div>
      </div>

      <div class="section-title">Catatan Evaluasi Mustami'</div>
      <div class="card" style="margin-bottom: 15px; min-height: 60px;">
        <div>${e.mustamiNote||`Tidak ada catatan khusus.`}</div>
      </div>

      <div class="section-title">Catatan PR / Tugas Tindak Lanjut</div>
      <div class="card" style="margin-bottom: 15px;">
        <div>${e.homework||`Tidak ada catatan PR.`} (${e.homeworkDone?`PR Selesai`:`PR Belum Selesai`})</div>
      </div>

      <div class="footer">
        <div class="sig-box">
          Guru Yang Dinilai<br><br><br><br>
          ( ${t} )
        </div>
        <div class="sig-box">
          Mustami' / Upgrader<br><br><br><br>
          ( ${e.mustamiName} )
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `;n.document.write(r),n.document.close()}var C=e(n(),1),w=r(),T=c,E=p,D=C.forwardRef(({className:e,...t},n)=>(0,w.jsx)(o,{className:i(`fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`,e),...t,ref:n}));D.displayName=o.displayName;var O=t(`fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out`,{variants:{side:{top:`inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top`,bottom:`inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom`,left:`inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm`,right:`inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm`}},defaultVariants:{side:`right`}}),k=C.forwardRef(({side:e=`right`,className:t,children:n,...r},a)=>(0,w.jsxs)(E,{children:[(0,w.jsx)(D,{}),(0,w.jsxs)(f,{ref:a,className:i(O({side:e}),t),...r,children:[(0,w.jsxs)(s,{className:`absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary`,children:[(0,w.jsx)(h,{className:`h-4 w-4`}),(0,w.jsx)(`span`,{className:`sr-only`,children:`Close`})]}),n]})]}));k.displayName=f.displayName;var A=({className:e,...t})=>(0,w.jsx)(`div`,{className:i(`flex flex-col space-y-2 text-center sm:text-left`,e),...t});A.displayName=`SheetHeader`;var j=C.forwardRef(({className:e,...t},n)=>(0,w.jsx)(d,{ref:n,className:i(`text-lg font-semibold text-foreground`,e),...t}));j.displayName=d.displayName;var M=C.forwardRef(({className:e,...t},n)=>(0,w.jsx)(m,{ref:n,className:i(`text-sm text-muted-foreground`,e),...t}));M.displayName=m.displayName;export{j as a,y as c,A as i,S as l,k as n,b as o,M as r,x as s,T as t};