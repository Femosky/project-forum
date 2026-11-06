// Structured data for search engines. "<" is escaped so user text can never close the script tag. Several items go
// in one "@graph" object rather than a bare array: search engines read both, but some browser extensions that parse
// structured data expect a single object and throw on an array.
export function JsonLd({ data }: { data: object | object[] }) {
    const payload = Array.isArray(data)
        ? { '@context': 'https://schema.org', '@graph': data.map((item) => withoutContext(item)) }
        : data;
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, '\\u003c') }}
        />
    );
}

// Items in a graph share its @context
function withoutContext(item: object) {
    const rest: Record<string, unknown> = { ...item };
    delete rest['@context'];
    return rest;
}

export default JsonLd;
