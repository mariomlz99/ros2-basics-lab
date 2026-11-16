// WASI clock IDs, timestamps and errno values follow wasi-libc's public ABI:
// https://github.com/WebAssembly/wasi-libc/blob/main/libc-bottom-half/headers/public/wasi/wasip1.h
export function clockTimeGet(memory, clockId, pointer) {
  // Browser workers expose wall and monotonic time, but not process/thread CPU time.
  if (clockId !== 0 && clockId !== 1) return 28; // EINVAL
  const address = pointer >>> 0;
  const buffer = memory.buffer; // Refresh after WebAssembly memory growth.
  if (!Number.isInteger(pointer) || address + 8 > buffer.byteLength) return 21; // EFAULT
  const nanoseconds = clockId === 0
    ? BigInt(Date.now()) * 1000000n
    : BigInt(Math.floor(performance.now() * 1000000));
  new DataView(buffer).setBigUint64(address, nanoseconds, true);
  return 0;
}
