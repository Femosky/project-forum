class TimeUtility {
    static formatTimeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();

        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count > 0) {
                const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
                return rtf.format(-count, interval.label as Intl.RelativeTimeFormatUnit);
            }
        }

        return 'just now';
    }
}

export default TimeUtility;
