export function captureFocus(element = document.activeElement) {
  return element ? {
    element,
    id: element.id,
    form: element.form?.id,
    name: element.name,
    action: element.dataset?.action,
    keys: Object.fromEntries(
      ["view", "mode", "track", "index", "unit", "id"].map((k) => [
        k,
        element.dataset?.[k]
      ])
    )
  } : null;
}
export function restoreFocus(saved) {
  if (!saved) return false;
  let target = saved.element?.isConnected ? saved.element : saved.id ? document.getElementById(saved.id) : null;
  if (!target && saved.form && saved.name)
    target = document.getElementById(saved.form)?.elements.namedItem(saved.name);
  if (!target && saved.action)
    target = [...document.querySelectorAll("[data-action]")].find(
      (e) => e.dataset.action === saved.action && Object.entries(saved.keys).every(
        ([k, v]) => v === void 0 || e.dataset[k] === v
      )
    );
  if (!target || target.disabled || target.closest("[inert]")) return false;
  target.focus?.({ preventScroll: true });
  return document.activeElement === target;
}
export function focusWorkspace() {
  document.getElementById("main")?.focus({ preventScroll: true });
}
export function captureFormDrafts(root) {
  return [
    ...root?.querySelectorAll(
      "form[id] input[name],form[id] select[name],form[id] textarea[name]"
    ) || []
  ].filter(
    (e) => !["file", "submit", "button"].includes(e.type) && !e.disabled
  ).map((e) => ({
    form: e.closest("form").id,
    name: e.name,
    value: e.value,
    checked: e.checked
  }));
}
export function restoreFormDrafts(drafts) {
  for (const d of drafts) {
    const e = document.getElementById(d.form)?.elements.namedItem(d.name);
    if (!e || e.disabled || e.type === "file") continue;
    e.value = d.value;
    if (["checkbox", "radio"].includes(e.type)) e.checked = d.checked;
  }
}
