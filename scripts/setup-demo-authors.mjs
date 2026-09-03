// One-off dev-data setup for the demo role bar: splits the single bypass
// identity into two authors so "Author 1" and "Author 2" have different
// stories. Run against vsat-dev only. Dry run by default; --apply writes.
//
// TO REVERSE (dev DB, 2026-09-03): author 1066 was named "VSAT QA"; stories
// 1241 1242 1243 1245 1246 1247 all belonged to author 1066 and were titled
// "My story". Backup b002 was captured immediately before this ran.
import pg from "pg";
const APPLY = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const AUTHOR1_ID = 1066;                       // existing bypass identity (qa@vsat-dev.local)
const AUTHOR2_EMAIL = "author2@vsat-dev.local";
const MOVE = [1241, 1242, 1243, 1245, 1246, 1247];
const TITLES = {
  1241: "Riverside Walk",
  1242: "The Old Library",
  1243: "Market Day",
  1245: "Harbour Lights",
  1246: "The Long Field",
  1247: "Chapel Lane",
};

const client = await pool.connect();
try {
  // Record the exact prior state so this is reversible.
  const before = await client.query(
    `select s.id, s.title, ats.author_id from story s
     join author_to_story ats on ats.story_id = s.id where s.id = any($1)`, [MOVE]);
  const a1 = await client.query(`select id, name from author where id = $1`, [AUTHOR1_ID]);
  console.log("BEFORE (undo data):");
  console.log(JSON.stringify({ author1: a1.rows[0], stories: before.rows }, null, 2));

  if (!APPLY) { console.log("\n(dry run — pass --apply to write)"); process.exit(0); }

  await client.query("begin");
  await client.query(`update author set name = 'Author One' where id = $1`, [AUTHOR1_ID]);
  const a2 = await client.query(
    `insert into author (name, email) values ('Author Two', $1)
     on conflict (email) do update set name = excluded.name returning id`, [AUTHOR2_EMAIL]);
  const author2Id = a2.rows[0].id;

  for (const id of MOVE) {
    await client.query(
      `update author_to_story set author_id = $1 where story_id = $2 and author_id = $3`,
      [author2Id, id, AUTHOR1_ID]);
    await client.query(`update story set title = $1 where id = $2`, [TITLES[id], id]);
    await client.query(`update story_published set title = $1 where id = $2`, [TITLES[id], id]);
  }
  await client.query("commit");
  console.log(`\nAPPLIED. Author Two id=${author2Id}, moved ${MOVE.length} stories.`);
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("ROLLED BACK:", e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
