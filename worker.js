/**
 * Cloudflare Worker - Tugas Deadline
 *
 * Catatan:
 * 1. Buat D1 database lalu binding dengan nama DB.
 * 2. Jalankan schema.sql.
 * 3. Set VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY sebagai Worker secrets.
 * 4. Ganti VAPID_SUBJECT dengan mailto/URL milik kamu.
 *
 * Web Push membutuhkan library Web Crypto / implementasi VAPID.
 * File ini menyediakan API dasar + penyimpanan subscription.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      const sub = await request.json();
      if (!sub.endpoint) return json({error:"endpoint wajib ada"},400);
      if (!env.DB) return json({error:"D1 binding DB belum dikonfigurasi"},500);

      await env.DB.prepare(
        `INSERT INTO subscriptions(endpoint,p256dh,auth,created_at)
         VALUES(?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth`
      ).bind(sub.endpoint, sub.keys?.p256dh || "", sub.keys?.auth || "", Date.now()).run();

      return json({ok:true});
    }

    if (url.pathname === "/api/tasks" && request.method === "GET") {
      if (!env.DB) return json({error:"D1 binding DB belum dikonfigurasi"},500);
      const result = await env.DB.prepare("SELECT * FROM tasks ORDER BY deadline ASC").all();
      return json(result.results);
    }

    if (url.pathname === "/api/tasks" && request.method === "POST") {
      if (!env.DB) return json({error:"D1 binding DB belum dikonfigurasi"},500);
      const body = await request.json();
      if (!body.title || !body.deadline) return json({error:"title dan deadline wajib"},400);
      const id = body.id || crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO tasks(id,title,course,deadline,created_at)
         VALUES(?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title,course=excluded.course,deadline=excluded.deadline`
      ).bind(id,body.title,body.course||"",body.deadline,Date.now()).run();
      return json({ok:true,id});
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Tugas Deadline Worker aktif.");
  },

  async scheduled(event, env, ctx) {
    // Cron endpoint disiapkan untuk pemeriksaan deadline.
    // Pengiriman Web Push perlu VAPID signing + fetch ke push service.
    // Setelah VAPID secret dikonfigurasi, fungsi ini dapat dikembangkan
    // untuk mengirim notifikasi H-1 hari, H-3 jam, dan saat deadline.
    if (!env.DB) return;
    const now = Date.now();
    const rows = await env.DB.prepare(
      "SELECT * FROM tasks WHERE deadline BETWEEN ? AND ?"
    ).bind(now - 60000, now + 86400000).all();
    console.log("Tasks in notification window:", rows.results.length);
  }
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,headers:{"content-type":"application/json;charset=UTF-8"}
  });
}
