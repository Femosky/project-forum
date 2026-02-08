import { Button } from '@/components/ui/Button';

export function UserSection() {
    const user = true;
    const isLoading = false;

    return (
        <section className="w-full flex justify-end items-center gap-2 shrink-0">
            {isLoading ? (
                <div>Loading...</div>
            ) : user ? (
                <div>
                    <Button>Create Post</Button>
                    <Button>Logout</Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Button>Login</Button>
                    <Button>Sign up</Button>
                </div>
            )}
        </section>
    );
}
