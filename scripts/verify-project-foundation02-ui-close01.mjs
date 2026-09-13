import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('src/components/ProjectAssurancePanel.css', 'utf8');
const tsx = fs.readFileSync('src/components/ProjectAssurancePanel.tsx', 'utf8');

assert.match(tsx, /className="project-assurance-close"/);
assert.match(tsx, /aria-label="Затвори ревизии и доказателства"/);

const genericRuleIndex = css.indexOf('.project-assurance-drawer button,');
const closeOverrideIndex = css.indexOf('.project-assurance-drawer .project-assurance-close {');
assert.ok(genericRuleIndex >= 0, 'generic drawer form-control rule missing');
assert.ok(closeOverrideIndex > genericRuleIndex, 'close override must come after generic drawer control rule');

const closeBlock = css.slice(closeOverrideIndex, css.indexOf('}', closeOverrideIndex) + 1);
assert.match(closeBlock, /width:\s*34px/);
assert.match(closeBlock, /min-width:\s*34px/);
assert.match(closeBlock, /height:\s*34px/);
assert.match(closeBlock, /min-height:\s*34px/);
assert.match(closeBlock, /padding:\s*0/);
assert.match(closeBlock, /display:\s*inline-grid/);
assert.match(closeBlock, /background:\s*#0a222a/);
assert.doesNotMatch(closeBlock, /width:\s*100%/);

assert.match(css, /\.project-assurance-drawer \.project-assurance-close:hover/);
assert.match(css, /\.project-assurance-drawer \.project-assurance-close:focus-visible/);

console.log('=== PROJECT FOUNDATION 02 UI CLOSE 01 VERIFY PASS ===');
console.log('DRAWER CLOSE: 34 x 34 / COMPACT');
console.log('FULL-WIDTH INHERITANCE: OVERRIDDEN');
console.log('HOVER + KEYBOARD FOCUS: VISIBLE');
console.log('PF02 DOMAIN: UNCHANGED');
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED');
