import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// Display Components
export const Display1 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("display-1", className)}
      {...props}
    />
  )
);
Display1.displayName = "Display1";

export const Display2 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("display-2", className)}
      {...props}
    />
  )
);
Display2.displayName = "Display2";

export const Display3 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("display-3", className)}
      {...props}
    />
  )
);
Display3.displayName = "Display3";

// Heading Components
export const H1 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("heading-1", className)}
      {...props}
    />
  )
);
H1.displayName = "H1";

export const H2 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("heading-2", className)}
      {...props}
    />
  )
);
H2.displayName = "H2";

export const H3 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("heading-3", className)}
      {...props}
    />
  )
);
H3.displayName = "H3";

export const H4 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn("heading-4", className)}
      {...props}
    />
  )
);
H4.displayName = "H4";

// Body Components
export const Body = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("body", className)}
      {...props}
    />
  )
);
Body.displayName = "Body";

export const BodySmall = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("body-small", className)}
      {...props}
    />
  )
);
BodySmall.displayName = "BodySmall";

export const BodyLarge = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("body-large", className)}
      {...props}
    />
  )
);
BodyLarge.displayName = "BodyLarge";

// UI Components
export const Caption = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("caption", className)}
      {...props}
    />
  )
);
Caption.displayName = "Caption";

export const ButtonText = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("button-text", className)}
      {...props}
    />
  )
);
ButtonText.displayName = "ButtonText";

// Code Components
export const Code = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn("code", className)}
      {...props}
    />
  )
);
Code.displayName = "Code";

export const CodeLarge = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn("code-large", className)}
      {...props}
    />
  )
);
CodeLarge.displayName = "CodeLarge";

// Export all components
export const Typography = {
  Display1,
  Display2,
  Display3,
  H1,
  H2,
  H3,
  H4,
  Body,
  BodySmall,
  BodyLarge,
  Caption,
  ButtonText,
  Code,
  CodeLarge,
}; 