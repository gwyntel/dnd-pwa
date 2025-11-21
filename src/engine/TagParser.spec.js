import { describe, it, expect } from 'vitest';
import { tagParser } from './TagParser';

describe('TagParser', () => {
    it('should parse simple tags', () => {
        const input = 'This is a STATUS_ADD[Blinded] effect.';
        const { cleanText, tags } = tagParser.parse(input);

        expect(cleanText).toBe('This is a effect.');
        expect(tags).toHaveLength(1);
        expect(tags[0]).toEqual({
            type: 'STATUS_ADD',
            content: 'Blinded',
            raw: 'STATUS_ADD[Blinded]',
            index: 10
        });
    });

    it('should handle multiple tags', () => {
        const input = 'XP_GAIN[100] and ITEM_ADD[Potion]';
        const { cleanText, tags } = tagParser.parse(input);

        expect(cleanText).toBe('and');
        expect(tags).toHaveLength(2);
        expect(tags[0].type).toBe('XP_GAIN');
        expect(tags[1].type).toBe('ITEM_ADD');
    });

    it('should handle nested tags correctly', () => {
        const input = 'STATUS_ADD[Blinded|For ROLL[1d4] turns]';
        const { cleanText, tags } = tagParser.parse(input);

        expect(cleanText).toBe('');
        expect(tags).toHaveLength(1);
        expect(tags[0].content).toBe('Blinded|For ROLL[1d4] turns');
    });

    it('should ignore malformed tags (unbalanced brackets)', () => {
        const input = 'This is a BROKEN[tag without closing bracket';
        const { cleanText, tags } = tagParser.parse(input);

        expect(cleanText).toBe('This is a BROKEN[tag without closing bracket');
        expect(tags).toHaveLength(0);
    });

    it('should ignore tags with broken structure', () => {
        const input = 'BROKEN]start[ content';
        const { cleanText, tags } = tagParser.parse(input);
        expect(tags).toHaveLength(0);
    });

    it('should sanitize content but preserve nested tag structure', () => {
        const input = 'MSG[Hello <script>alert(1)</script> World]';
        const { cleanText, tags } = tagParser.parse(input);

        // Expect < > ( ) to be removed
        expect(tags[0].content).toBe('Hello scriptalert1script World');
    });

    it('should handle tags at start and end of string', () => {
        const input = 'TAG[start] middle TAG[end]';
        const { cleanText, tags } = tagParser.parse(input);
        expect(cleanText).toBe('middle');
        expect(tags).toHaveLength(2);
    });
});
