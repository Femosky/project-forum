// The card every sign-in page sits in
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-center px-4 py-12 sm:py-20">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 sm:border sm:border-border sm:p-8">
                <h1 className="text-2xl font-extrabold">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
}
