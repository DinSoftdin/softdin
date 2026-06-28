<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, ref, useId, watch, type Ref } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    trigger?: 'hover' | 'dblclick'
  }>(),
  {
    trigger: 'hover',
  },
)

const helpGroupKey = inject<Ref<string | null> | null>('centralFieldHelpGroup', null)
const instanceId = useId()

const helpRef = ref<HTMLElement | null>(null)
const pinned = ref(false)
const popoverStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

function updatePopoverPosition(): void {
  const element = helpRef.value
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  popoverStyle.value = {
    top: `${rect.top - 8}px`,
    left: `${rect.left + rect.width / 2}px`,
  }
}

function showHelp(): void {
  if (helpGroupKey) {
    helpGroupKey.value = instanceId
  }

  pinned.value = true
  void nextTick(updatePopoverPosition)
}

function hideHelp(): void {
  pinned.value = false

  if (helpGroupKey?.value === instanceId) {
    helpGroupKey.value = null
  }
}

function onDblClick(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  showHelp()
}

function onMouseLeave(): void {
  if (props.trigger !== 'dblclick') {
    return
  }

  hideHelp()
}

function onKeydown(event: KeyboardEvent): void {
  if (props.trigger !== 'dblclick') {
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    showHelp()
  }

  if (event.key === 'Escape' && pinned.value) {
    hideHelp()
  }
}

function onBlur(): void {
  if (props.trigger !== 'dblclick') {
    return
  }

  hideHelp()
}

watch(pinned, (isPinned) => {
  if (props.trigger !== 'dblclick' || !isPinned) {
    window.removeEventListener('resize', updatePopoverPosition)
    window.removeEventListener('scroll', updatePopoverPosition, true)
    return
  }

  updatePopoverPosition()
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, true)
})

watch(
  () => helpGroupKey?.value,
  (activeKey) => {
    if (props.trigger === 'dblclick' && activeKey !== instanceId) {
      pinned.value = false
    }
  },
)

watch(
  () => props.trigger,
  () => {
    pinned.value = false
    if (helpGroupKey?.value === instanceId) {
      helpGroupKey.value = null
    }
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
})
</script>

<template>
  <span
    ref="helpRef"
    class="field-help"
    :class="{ 'field-help-dblclick': trigger === 'dblclick', 'field-help-pinned': pinned }"
    tabindex="0"
    role="button"
    :aria-label="text"
    :aria-expanded="trigger === 'dblclick' ? pinned : undefined"
    @click.prevent
    @dblclick="trigger === 'dblclick' ? onDblClick($event) : undefined"
    @mouseleave="onMouseLeave"
    @blur="onBlur"
    @keydown="onKeydown"
  >
    <svg viewBox="0 0 20 20" aria-hidden="true" class="field-help-icon">
      <path
        fill="currentColor"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.5a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM9 9.75A.75.75 0 0 1 9.75 9h.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-3.75H9.75A.75.75 0 0 1 9 9.75Z"
      />
    </svg>

    <span
      v-if="trigger === 'hover'"
      class="field-help-tooltip field-help-tooltip-inline"
      role="tooltip"
    >
      {{ text }}
    </span>

    <Teleport v-if="trigger === 'dblclick' && pinned" to="body">
      <span
        class="field-help-tooltip field-help-tooltip-floating"
        role="tooltip"
        :style="{
          top: popoverStyle.top,
          left: popoverStyle.left,
        }"
      >
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>

<style scoped>
.field-help {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: 0.25rem;
  vertical-align: middle;
  border: none;
  background: transparent;
  padding: 0;
  color: #64748b;
  cursor: help;
  outline: none;
}

.field-help-dblclick {
  cursor: pointer;
}

.field-help-pinned {
  color: var(--color-brand-600);
}

.field-help-icon {
  width: 1rem;
  height: 1rem;
}

.field-help:hover,
.field-help:focus-visible {
  color: var(--color-brand-600);
}

.field-help-tooltip {
  border-radius: 0.5rem;
  background: #0f172a;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
  color: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.field-help-tooltip-inline {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.5rem);
  z-index: 70;
  width: max-content;
  max-width: min(18rem, calc(100vw - 2.5rem));
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.field-help-tooltip-inline::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 0.375rem solid transparent;
  border-top-color: #0f172a;
}

.field-help:hover .field-help-tooltip-inline,
.field-help:focus-visible .field-help-tooltip-inline {
  opacity: 1;
  visibility: visible;
}

.field-help-dblclick:hover .field-help-tooltip-inline,
.field-help-dblclick:focus-visible .field-help-tooltip-inline {
  opacity: 0;
  visibility: hidden;
}
</style>

<style>
.field-help-tooltip-floating {
  position: fixed;
  z-index: 120;
  width: max-content;
  max-width: min(18rem, calc(100vw - 2rem));
  transform: translate(-50%, -100%);
  pointer-events: none;
}

.field-help-tooltip-floating::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 0.375rem solid transparent;
  border-top-color: #0f172a;
}
</style>
