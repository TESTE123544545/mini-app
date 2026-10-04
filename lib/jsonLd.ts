/** JSON for a <script type="application/ld+json"> tag: "<" is escaped so no text inside it can close the tag. */
export const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\u003c");
