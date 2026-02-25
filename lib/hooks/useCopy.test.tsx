import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, mock } from "bun:test";
import React from "react";
import { useCopy } from "./useCopy";

function TestHarness({
  text,
  onCopy,
}: {
  text: string;
  onCopy?: () => void;
}) {
  const { copied, handleCopy } = useCopy({ text, onCopy });
  return (
    <div>
      <button type="button" onClick={handleCopy}>
        Copy
      </button>
      <span data-copied={copied}>{copied ? "Copied" : "Not copied"}</span>
    </div>
  );
}

function mockNavigatorClipboard(writeText: (text: string) => Promise<void>) {
  const nav = globalThis.navigator as { clipboard?: unknown };
  const original = nav.clipboard;
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: original,
      configurable: true,
      writable: true,
    });
  };
}

function removeNavigatorClipboard() {
  const nav = globalThis.navigator as { clipboard?: unknown };
  const original = nav.clipboard;
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  return () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: original,
      configurable: true,
      writable: true,
    });
  };
}

test("1. Modern clipboard path: writeText called with exact text and copied becomes true", async () => {
  const writeText = mock(() => Promise.resolve());
  const restore = mockNavigatorClipboard(writeText);
  try {
    render(<TestHarness text="hello world" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("hello world");
    expect(screen.getByText("Copied")).toBeTruthy();
  } finally {
    restore();
  }
});

test("2. Modern clipboard path – rejection: copied remains false", async () => {
  const writeText = mock(() => Promise.reject(new Error("clipboard denied")));
  const restore = mockNavigatorClipboard(writeText);
  const originalConsoleError = console.error;
  console.error = () => {}; // hook logs on rejection; suppress in test
  try {
    render(<TestHarness text="fail me" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith("fail me");
    expect(screen.getByText("Not copied")).toBeTruthy();
  } finally {
    console.error = originalConsoleError;
    restore();
  }
});

test("3. Fallback path: execCommand copy and textarea has plain text", async () => {
  const restore = removeNavigatorClipboard();
  try {
    const execCommand = mock(() => true);
    document.execCommand = execCommand;

    render(<TestHarness text="fallback plain string" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(screen.getByText("Copied")).toBeTruthy();
  } finally {
    restore();
  }
});

test("4. Fallback path – execCommand false: copied remains false", async () => {
  const restore = removeNavigatorClipboard();
  try {
    document.execCommand = mock(() => false);

    render(<TestHarness text="no copy" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(screen.getByText("Not copied")).toBeTruthy();
  } finally {
    restore();
  }
});

test("5. handleCopy calls event.stopPropagation()", async () => {
  const writeText = mock(() => Promise.resolve());
  const restore = mockNavigatorClipboard(writeText);
  try {
    let parentClicked = false;
    render(
      <div onClick={() => (parentClicked = true)}>
        <TestHarness text="stop" />
      </div>
    );
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    // If stopPropagation was called, the parent div's onClick should not have run
    expect(parentClicked).toBe(false);
  } finally {
    restore();
  }
});

test("6. Auto-reset timer: copied becomes false after ~1.5s", async () => {
  const writeText = mock(() => Promise.resolve());
  const restore = mockNavigatorClipboard(writeText);
  try {
    render(<TestHarness text="timer test" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);
    expect(screen.getByText("Copied")).toBeTruthy();

    await waitFor(
      () => {
        expect(screen.getByText("Not copied")).toBeTruthy();
      },
      { timeout: 2500 }
    );
  } finally {
    restore();
  }
});

test("7. Text change reset: when text prop changes, copied resets to false", async () => {
  const writeText = mock(() => Promise.resolve());
  const restore = mockNavigatorClipboard(writeText);
  try {
    const { rerender } = render(<TestHarness text="first" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);
    expect(screen.getByText("Copied")).toBeTruthy();

    rerender(<TestHarness text="second" />);

    expect(screen.getByText("Not copied")).toBeTruthy();
  } finally {
    restore();
  }
});

test("8. Plain string: value written is raw string (no HTML stripping)", async () => {
  const writeText = mock((t: string) => {
    expect(t).toBe("<script>alert(1)</script>");
    return Promise.resolve();
  });
  const restore = mockNavigatorClipboard(writeText);
  try {
    render(<TestHarness text="<script>alert(1)</script>" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith("<script>alert(1)</script>");
    expect(screen.getByText("Copied")).toBeTruthy();
  } finally {
    restore();
  }
});

test("onCopy callback is invoked on success (modern path)", async () => {
  const writeText = mock(() => Promise.resolve());
  const onCopy = mock(() => {});
  const restore = mockNavigatorClipboard(writeText);
  try {
    render(<TestHarness text="cb" onCopy={onCopy} />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);

    expect(onCopy).toHaveBeenCalled();
  } finally {
    restore();
  }
});
