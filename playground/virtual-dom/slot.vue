<script setup lang="tsx">
function Comp(_: any, { slots }: any) {
  return (
    <span>
      <template v-for={(Slot, slotName) in slots} key={slotName}>
        <slot name={slotName} />
      </template>
    </span>
  )
}

const getSlots = () => ({ slots: { default: () => <span>default slot</span> } })
defineRender(
  () => (
    <Comp>
      {getSlots().slots}
    </Comp>
  ),
)
</script>
