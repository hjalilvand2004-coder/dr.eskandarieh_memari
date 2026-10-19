module.exports=[23322,e=>{"use strict";async function s(){try{if("u"<typeof process||process.release?.name!=="node")return;let s=await e.A(6714),r=(await e.A(11105)).join(process.cwd(),"crash-log.txt"),n=(e,n)=>{try{let t=new Date().toISOString(),a=n instanceof Error?n.stack??n.message:String(n);s.appendFileSync(r,`[${t}] ${e}
${a}

`)}catch{}},t=globalThis;if(t.__shirazCrashHooked)return;t.__shirazCrashHooked=!0,process.on("uncaughtException",e=>n("uncaughtException (next server)",e)),process.on("unhandledRejection",e=>n("unhandledRejection (next server)",e))}catch{}}e.s(["register",()=>s])},6714,e=>{e.v(s=>Promise.all(["server/chunks/[externals]_node:fs_ddf6f167._.js"].map(s=>e.l(s))).then(()=>s(2157)))},11105,e=>{e.v(s=>Promise.all(["server/chunks/[externals]_node:path_d28a9bfe._.js"].map(s=>e.l(s))).then(()=>s(50227)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__fe4fb629._.js.map