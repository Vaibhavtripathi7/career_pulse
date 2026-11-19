// Machine specs and resource sampling from /proc and cgroup v2 (Linux only).
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";

const CLK_TCK = Number(execFileSync("getconf", ["CLK_TCK"]).toString().trim()) || 100;

function read(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** User + system CPU seconds a process has used so far. */
export function procCpuSeconds(pid: number): number | null {
  const stat = read(`/proc/${pid}/stat`);
  if (!stat) return null;
  // Fields after the "(comm)" field; utime and stime are fields 14 and 15.
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  return (Number(fields[11]) + Number(fields[12])) / CLK_TCK;
}

export function procRssMB(pid: number): number | null {
  const status = read(`/proc/${pid}/status`);
  const kb = status ? /VmRSS:\s+(\d+)/.exec(status)?.[1] : undefined;
  return kb ? Number(kb) / 1024 : null;
}

/** Machine-wide CPU jiffies: busy and total, from the first line of /proc/stat. */
export function machineCpu(): { busy: number; total: number } {
  const line = (read("/proc/stat") ?? "").split("\n")[0] ?? "";
  const v = line.trim().split(/\s+/).slice(1, 9).map(Number);
  const total = v.reduce((a, b) => a + b, 0);
  const idle = (v[3] ?? 0) + (v[4] ?? 0); // idle + iowait
  return { busy: total - idle, total };
}

/**
 * Busy jiffies and current clock (MHz) for each CPU. scaling_cur_freq reports the
 * effective clock, boost included.
 */
export function perCpuSnapshot(): { busy: number[]; mhz: (number | null)[] } {
  const busy: number[] = [];
  const mhz: (number | null)[] = [];
  for (const line of (read("/proc/stat") ?? "").split("\n")) {
    const m = /^cpu(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const v = (m[2] ?? "").trim().split(/\s+/).slice(0, 8).map(Number);
    busy.push(v.reduce((a, b) => a + b, 0) - (v[3] ?? 0) - (v[4] ?? 0));
    const khz = read(`/sys/devices/system/cpu/cpu${m[1]}/cpufreq/scaling_cur_freq`);
    mhz.push(khz ? Number(khz) / 1000 : null);
  }
  return { busy, mhz };
}

export function memInfo(): { availableMB: number; swapUsedMB: number } {
  const text = read("/proc/meminfo") ?? "";
  const kb = (key: string) => Number(new RegExp(`^${key}:\\s+(\\d+)`, "m").exec(text)?.[1] ?? 0);
  return {
    availableMB: kb("MemAvailable") / 1024,
    swapUsedMB: (kb("SwapTotal") - kb("SwapFree")) / 1024,
  };
}

/** cgroup v2 cpu.stat path of a running container, found through its main PID. */
export function containerCpuStatPath(container: string): string | null {
  try {
    const pid = execFileSync("docker", ["inspect", "-f", "{{.State.Pid}}", container]).toString().trim();
    const cgroup = read(`/proc/${pid}/cgroup`) ?? "";
    const rel = /^0::(.+)$/m.exec(cgroup)?.[1];
    const file = rel ? `/sys/fs/cgroup${rel}/cpu.stat` : null;
    return file && fs.existsSync(file) ? file : null;
  } catch {
    return null;
  }
}

export function cgroupCpuSeconds(cpuStatPath: string): number | null {
  const text = read(cpuStatPath);
  const usec = text ? /^usage_usec (\d+)/m.exec(text)?.[1] : undefined;
  return usec ? Number(usec) / 1e6 : null;
}

function physicalCores(): number {
  const info = read("/proc/cpuinfo") ?? "";
  const cores = new Set<string>();
  let physical = "0";
  for (const line of info.split("\n")) {
    const [key, value] = line.split(":").map((s) => s.trim());
    if (key === "physical id") physical = value ?? "0";
    if (key === "core id") cores.add(`${physical}:${value}`);
  }
  return cores.size || os.cpus().length;
}

export interface MachineSpecs {
  cpuModel: string;
  physicalCores: number;
  logicalCpus: number;
  maxMHz: number | null;
  ramGiB: number;
  os: string;
  kernel: string;
  node: string;
  docker: string;
  loadAverage: number[];
  memAvailableMB: number;
}

export function machineSpecs(): MachineSpecs {
  const osRelease = read("/etc/os-release") ?? "";
  const maxKHz = read("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq");
  let docker = "unknown";
  try {
    docker = execFileSync("docker", ["version", "--format", "{{.Server.Version}}"]).toString().trim();
  } catch {
    /* docker not reachable */
  }
  return {
    cpuModel: os.cpus()[0]?.model.trim() ?? "unknown",
    physicalCores: physicalCores(),
    logicalCpus: os.cpus().length,
    maxMHz: maxKHz ? Math.round(Number(maxKHz) / 1000) : null,
    ramGiB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    os: /^PRETTY_NAME="?([^"\n]+)"?/m.exec(osRelease)?.[1] ?? os.type(),
    kernel: os.release(),
    node: process.version,
    docker,
    loadAverage: os.loadavg().map((l) => Math.round(l * 100) / 100),
    memAvailableMB: Math.round(memInfo().availableMB),
  };
}
