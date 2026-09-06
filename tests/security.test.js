const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const page of ['index.html', 'kanji.html']) {
  test(`${page} restricts executable and network content with CSP`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    const match = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/);
    assert.ok(match, 'Content-Security-Policy meta tag is required');
    const policy = match[1];
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /script-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'self'/);
    assert.match(policy, /connect-src 'self' https:\/\/ilufwstrgvlkzztjvyll\.supabase\.co https:\/\/api\.mymemory\.translated\.net https:\/\/kanjiapi\.dev/);
    assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
    assert.doesNotMatch(policy, /script-src[^;]*'unsafe-eval'/);
  });
}
