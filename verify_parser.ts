
import fs from 'fs';
import { parseGitLogText } from './lib/parsers';

const text = fs.readFileSync('gitlog.txt', 'utf-8');
const events = parseGitLogText(text);

console.log(`Parsed ${events.length} events.`);
if (events.length > 0) {
    console.log('First event:', JSON.stringify(events[0], null, 2));
} else {
    console.error('No events parsed!');
}
