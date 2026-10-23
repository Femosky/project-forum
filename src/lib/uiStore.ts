import { create } from 'zustand';

// Client state shared between islands that don't sit in the same component tree
type UIStore = {
    // Why the sign-in prompt is open (e.g. "vote"), or null when it's closed
    signInReason: string | null;
    promptSignIn: (reason: string) => void;
    closeSignIn: () => void;

    // Comment counts changed on this page since it rendered, by post id
    commentCounts: Record<string, number>;
    setCommentCount: (postId: string, count: number) => void;

    // Bumped on join/leave so the sidebar refetches the viewer's communities
    membershipVersion: number;
    membershipChanged: () => void;
};

export const useUIStore = create<UIStore>()((set) => ({
    signInReason: null,
    promptSignIn: (reason) => set({ signInReason: reason }),
    closeSignIn: () => set({ signInReason: null }),

    commentCounts: {},
    setCommentCount: (postId, count) => set((state) => ({ commentCounts: { ...state.commentCounts, [postId]: count } })),

    membershipVersion: 0,
    membershipChanged: () => set((state) => ({ membershipVersion: state.membershipVersion + 1 })),
}));
