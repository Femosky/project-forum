import { cloneElement, isValidElement, ReactNode, Ref, RefCallback, useMemo } from 'react';

// Renders its only child with these props merged in (the asChild pattern): handlers both run (the child's first),
// classes and styles combine, refs both receive the node. A few lines instead of Radix Slot.

type AnyProps = Record<string, unknown>;

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
}

export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
    return (node) => refs.forEach((ref) => setRef(ref, node));
}

export function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
    const merged: AnyProps = { ...slotProps, ...childProps };
    for (const key in slotProps) {
        const slotValue = slotProps[key];
        const childValue = childProps[key];
        if (/^on[A-Z]/.test(key) && typeof slotValue === 'function' && typeof childValue === 'function') {
            merged[key] = (...args: unknown[]) => {
                const result = childValue(...args);
                slotValue(...args);
                return result;
            };
        } else if (key === 'className' && slotValue && childValue) {
            merged.className = `${slotValue} ${childValue}`;
        } else if (key === 'style' && slotValue && childValue) {
            merged.style = { ...(slotValue as object), ...(childValue as object) };
        }
    }
    return merged;
}

export function Slot({ children, ref, ...props }: AnyProps & { children?: ReactNode; ref?: Ref<HTMLElement> }) {
    const child = isValidElement<AnyProps>(children) ? children : null;
    const childRef = child?.props.ref as Ref<HTMLElement> | undefined;
    // The refs are only handed on to the child, never read here
    // eslint-disable-next-line react-hooks/refs
    const composedRef = useMemo(() => (ref && childRef ? composeRefs(ref, childRef) : (ref ?? childRef)), [ref, childRef]);
    if (!child) return null;
    // eslint-disable-next-line react-hooks/refs
    return cloneElement(child, { ...mergeProps(props, child.props), ref: composedRef });
}

export default Slot;
