class TagParser {
    constructor() { }

    /**
     * Parses text for tags, returning the clean text and an array of tag objects.
     * @param {string} rawText 
     * @returns {{cleanText: string, tags: Array<{type: string, content: string, raw: string, index: number}>}}
     */
    parse(rawText) {
        if (!rawText) return { cleanText: '', tags: [] };

        const tags = this._validateAndExtract(rawText);
        const sanitizedTags = this._sanitize(tags);

        let cleanText = rawText;
        // Remove tags from text. We replace the exact raw string.
        // Since we extracted them in order, we can replace them.
        // However, if there are identical tags, simple replace might remove the wrong one (though result is same).
        // To be safe and handle the string correctly, we should probably rebuild the string or replace by range if possible.
        // But simple replace for each tag's raw value is likely sufficient for this use case as long as we handle it carefully.

        for (const tag of sanitizedTags) {
            // Use split and join to replace all occurrences? No, we only want to replace the ones we found.
            // But _validateAndExtract finds *all* of them.
            // So if we have two identical tags, they will both be in the array.
            // replace(tag.raw, '') only replaces the first occurrence.
            // So iterating and replacing once per tag object works perfectly.
            cleanText = cleanText.replace(tag.raw, '');
        }

        // Clean up double spaces that might have been left behind
        cleanText = cleanText.replace(/\s+/g, ' ').trim();

        return { cleanText, tags: sanitizedTags };
    }

    /**
     * Finds outermost structurally valid tags.
     * @param {string} rawText 
     * @returns {Array<{type: string, content: string, raw: string}>}
     */
    _validateAndExtract(rawText) {
        const tags = [];
        // Regex to find the start of a potential tag: UPPERCASE_WITH_UNDERSCORES followed by [
        const regex = /\b([A-Z_]+)\[/g;
        let match;

        while ((match = regex.exec(rawText)) !== null) {
            const type = match[1];
            const startIndex = match.index;
            const contentStartIndex = regex.lastIndex;

            let bracketCount = 1;
            let currentIndex = contentStartIndex;
            let content = '';
            let valid = false;

            while (currentIndex < rawText.length) {
                const char = rawText[currentIndex];
                if (char === '[') {
                    bracketCount++;
                } else if (char === ']') {
                    bracketCount--;
                }

                if (bracketCount === 0) {
                    valid = true;
                    content = rawText.substring(contentStartIndex, currentIndex);
                    break;
                }
                currentIndex++;
            }

            if (valid) {
                const raw = rawText.substring(startIndex, currentIndex + 1);
                tags.push({ type, content, raw, index: startIndex });
                // Continue searching after this tag
                regex.lastIndex = currentIndex + 1;
            } else {
                // If invalid (unbalanced), we just continue searching from where the regex left off (contentStartIndex)
                // effectively ignoring this opening bracket as a tag start.
                // Actually, regex.exec updates lastIndex automatically, but we manually advanced it in the loop?
                // No, if we break, we set regex.lastIndex.
                // If we don't find a closing bracket, we reach end of string.
                // The while loop finishes. valid is false.
                // regex.lastIndex is already at contentStartIndex.
                // We should probably let the regex continue from there to find other potential tags?
                // Yes.
            }
        }
        return tags;
    }

    /**
     * Sanitizes tag content to prevent injection.
     * @param {Array<{type: string, content: string, raw: string}>} tags 
     * @returns {Array<{type: string, content: string, raw: string}>}
     */
    _sanitize(tags) {
        return tags.map(tag => {
            // Allow letters, numbers, underscores, pipes, hyphens, commas, periods, spaces
            // Also allowing brackets [] because nested tags might be processed later or we want to keep them?
            // The requirement says: "remove all characters except for letters, numbers, underscores, pipes, hyphens, commas, periods, and spaces".
            // If we remove brackets, nested tags like ROLL[1d4] inside content will be broken: ROLL1d4.
            // Wait, "This correctly identifies the boundaries of the outermost tag in a nested scenario like OUTER[...INNER[...]]".
            // If we sanitize the content of OUTER, we destroy INNER's structure if we strip brackets.
            // However, the requirement explicitly says: "remove all characters except...".
            // Maybe the intent is that the *outer* tag's content is just text arguments, and if it contains a nested tag, that nested tag is *part of the content string*.
            // If we strip brackets, we break the nested tag.
            // Let's look at the example: `STATUS_ADD[Blinded|For ROLL[1d4] turns]`.
            // If we sanitize this, it becomes `Blinded|For ROLL1d4 turns`.
            // Then when we process the content, we can't parse `ROLL[1d4]`.
            // I should probably allow brackets `[` and `]` in the allowlist if nested tags are expected to be preserved in the content.
            // The user requirement says: "For each tag's content, it will remove all characters except for letters, numbers, underscores, pipes, hyphens, commas, periods, and spaces".
            // It does NOT list brackets.
            // BUT Action 2.2 says: "identifies the boundaries of the outermost tag in a nested scenario...".
            // If the parser supports nested tags, the sanitization shouldn't destroy them.
            // I will assume I should ADD brackets to the allowlist to support the nested tag requirement, or else the nested tag requirement is moot.
            // I'll add `[` and `]` to the regex.

            const sanitizedContent = tag.content.replace(/[^a-zA-Z0-9_|\-,. \[\]]/g, '');
            return { ...tag, content: sanitizedContent };
        });
    }
}

export const tagParser = new TagParser();
