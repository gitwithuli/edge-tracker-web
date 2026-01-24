"use client"

import * as React from "react"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#C45A3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]
        dark:focus-visible:ring-offset-[#0F0F0F]
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-[#8B9A7D]' : 'bg-[#0F0F0F]/20 dark:bg-white/20'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
