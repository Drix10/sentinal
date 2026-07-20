export interface ProjectInfo {
    name: string;
    framework: string;
    language: string;
    packageManager: string;

    hasDocker: boolean;
    hasEnv: boolean;
    hasGit: boolean;

    sourceDirectory: string;
}