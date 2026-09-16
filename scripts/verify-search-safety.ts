import {
  safeString,
  safeToLowerCase,
  safeIncludes,
  safeMatchMultiEntries,
  matchesSearchQuery,
  safeLocaleCompareTitle,
} from '../src/utils/searchSafety.ts';

console.log('=== RUNNING SEARCH RUNTIME SAFETY UNIT & EDGE CASE TESTS ===');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${msg}`);
  } else {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
}

// 1. Safe String & ToLowerCase
assert(safeString(null) === '', 'safeString(null) returns empty string');
assert(safeString(undefined) === '', 'safeString(undefined) returns empty string');
assert(safeString(123) === '123', 'safeString(123) returns "123"');
assert(safeString({ foo: 'bar' }) === '', 'safeString(object) returns empty string');
assert(safeToLowerCase(null) === '', 'safeToLowerCase(null) does not throw');
assert(safeToLowerCase('GOOGLE') === 'google', 'safeToLowerCase("GOOGLE") === "google"');
assert(safeToLowerCase('أمان') === 'أمان', 'safeToLowerCase("أمان") preserved in Arabic');

// 2. Safe Includes
assert(safeIncludes(null, 'a') === false, 'safeIncludes(null, "a") is false');
assert(safeIncludes(undefined, 'a') === false, 'safeIncludes(undefined, "a") is false');
assert(safeIncludes('Google Cloud', 'google') === true, 'safeIncludes case insensitive match');
assert(safeIncludes('حساب البنك الأهلي', 'الأهلي') === true, 'safeIncludes Arabic match');

// 3. MultiEntry Edge Cases
const corruptEntries = [
  null,
  undefined,
  { id: '1', label: null, value: 'abc' },
  { id: '2', label: 'API', value: null },
  { id: '3', label: undefined, value: undefined },
  { id: '4', label: 'Stripe Secret', value: 'sk_test_12345' },
];

assert(safeMatchMultiEntries(corruptEntries, 'abc') === true, 'safeMatchMultiEntries with null label and "abc" value');
assert(safeMatchMultiEntries(corruptEntries, 'API') === true, 'safeMatchMultiEntries with "API" label and null value');
assert(safeMatchMultiEntries(corruptEntries, 'sk_test') === true, 'safeMatchMultiEntries with valid entries');
assert(safeMatchMultiEntries(null, 'test') === false, 'safeMatchMultiEntries with null entries array');
assert(safeMatchMultiEntries(undefined, 'test') === false, 'safeMatchMultiEntries with undefined entries array');

// 4. Incomplete VaultItem edge cases
const incompleteItem1: any = {
  id: 'item-1',
  title: 'Google Workspace',
  description: null,
  category: 'web',
  url: null,
  username: undefined,
  email: null,
  apiKeys: null,
  licenseKeys: undefined,
  urls: null,
};

const incompleteItem2: any = {
  id: 'item-2',
  title: 'منصة أبشر الحكومية',
  description: 'تسجيل الدخول الحكومي 123',
  category: 'gov',
  apiKeys: [{ id: 'k1', label: null, value: 'absher_token_99' }],
  licenseKeys: [{ id: 'l1', label: 'رخصة النظام', value: null }],
};

const emptyItem: any = {
  id: 'item-3',
  title: '',
};

// Test queries "a", "أ", "1", and "No matches"
assert(matchesSearchQuery(incompleteItem1, 'a') === true, 'Query "a" matches "Google Workspace"');
assert(matchesSearchQuery(incompleteItem1, 'g') === true, 'Query "g" matches "Google Workspace"');
assert(matchesSearchQuery(incompleteItem2, 'أ') === true, 'Query "أ" matches "منصة أبشر"');
assert(matchesSearchQuery(incompleteItem2, '1') === true, 'Query "1" matches description with "123"');
assert(matchesSearchQuery(incompleteItem2, 'absher_token') === true, 'Query matches token in corrupted MultiEntry');
assert(matchesSearchQuery(incompleteItem2, 'رخصة') === true, 'Query matches label in corrupted MultiEntry');
assert(matchesSearchQuery(incompleteItem1, 'nonexistentquery999') === false, 'No match returns false safely');
assert(matchesSearchQuery(emptyItem, 'a') === false, 'Empty item with query "a" safely returns false');
assert(matchesSearchQuery(null, 'a') === false, 'null item safely returns false');
assert(matchesSearchQuery(undefined, 'a') === false, 'undefined item safely returns false');

// 5. Title Sorting test
const itemA = { title: 'أحمد' };
const itemB = { title: 'بدر' };
const itemC = { title: null };
assert(safeLocaleCompareTitle(itemA, itemB) < 0, 'safeLocaleCompareTitle sorts Arabic correctly');
assert(typeof safeLocaleCompareTitle(itemC, itemA) === 'number', 'safeLocaleCompareTitle handles null title without crash');

console.log(`\n=== ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! ===`);
