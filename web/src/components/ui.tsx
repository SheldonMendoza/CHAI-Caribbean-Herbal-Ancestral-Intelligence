/** CHAI design-system primitives: Button, Card, Badge, Input, Select, EmptyState, Tooltip. */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

/* ---------------- Button ---------------- */

type ButtonVariant = 'primary' | 'accent' | 'gold' | 'outline' | 'outline-light' | 'disabled';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  to?: string;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  gold: 'btn-gold',
  outline: 'btn-outline',
  'outline-light': 'btn-outline-light',
  disabled: 'btn-disabled',
};

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = `btn ${variantClass[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="card-body">{children}</div>;
}

/* ---------------- Badge ---------------- */

export function Badge({
  children,
  className = '',
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <span className={`badge ${className}`.trim()} aria-label={label}>
      {children}
    </span>
  );
}

/* ---------------- Input / Select ---------------- */

interface FieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Field({ id, label, children, hint }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <span className="sr-only">{hint}</span>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${props.className ?? ''}`.trim()} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`select ${props.className ?? ''}`.trim()} {...props} />;
}

/* ---------------- EmptyState ---------------- */

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      {children}
      {action}
    </div>
  );
}

/** Inline "Not yet documented" marker for fields the research has not filled. */
export function NotDocumented() {
  return <span className="not-documented">Not yet documented</span>;
}

/* ---------------- Tooltip ---------------- */

export function Tooltip({
  text,
  children,
  id,
}: {
  text: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <span className="tooltip" tabIndex={0} aria-describedby={id}>
      {children}
      <span className="tooltip-bubble" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}
