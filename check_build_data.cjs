const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://bifrost-admin:bifrost-admin@127.0.0.1/webstudio_db"
  });
  await client.connect();
  const res = await client.query("SELECT instances, pages, props FROM public.\"Build\" ORDER BY \"createdAt\" DESC LIMIT 1");
  if (res.rows.length > 0) {
    console.log("Instances Type:", typeof res.rows[0].instances);
    console.log("Pages:", JSON.stringify(res.rows[0].pages).substring(0, 100));
  } else {
    console.log("No builds found.");
  }
  await client.end();
}

run().catch(console.error);
