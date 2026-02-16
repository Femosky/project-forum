class NumberUtility {
    static compactFormatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    });
}

export default NumberUtility;
