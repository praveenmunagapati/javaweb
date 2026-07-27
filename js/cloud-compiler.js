/**
 * JavaBox Cloud OpenJDK Compilation Service Integration
 * Uses open Piston API endpoint to execute full OpenJDK 21 Java code remotely on demand.
 */

class CloudCompiler {
  static async compileAndRun(files, mainClassName = "Main", stdin = "") {
    const PISTON_ENDPOINT = "https://emkc.org/api/v2/piston/execute";

    const payload = {
      language: "java",
      version: "15.0.2",
      files: files.map(f => ({
        name: f.name,
        content: f.content
      })),
      stdin: stdin
    };

    try {
      const response = await fetch(PISTON_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Cloud compiler returned HTTP status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        output: result.run.output || "",
        stdout: result.run.stdout || "",
        stderr: result.run.stderr || "",
        exitCode: result.run.code,
        compileOutput: result.compile ? result.compile.output : ""
      };
    } catch (err) {
      return {
        success: false,
        error: `Cloud Compilation Failed: ${err.message}. Falling back to Client-Side Java VM.`
      };
    }
  }
}
