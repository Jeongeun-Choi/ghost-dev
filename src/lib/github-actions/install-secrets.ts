import type { Octokit } from "@octokit/rest";
import sodium from "libsodium-wrappers";

type OctokitInstance = InstanceType<typeof Octokit>;

interface SecretEntry {
  name: string;
  value: string;
}

/**
 * 유저 레포에 GitHub Actions 시크릿을 등록합니다.
 * GitHub API는 libsodium 공개키 암호화를 요구합니다.
 */
export async function installRepoSecrets(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  secrets: SecretEntry[],
): Promise<{ installed: string[]; failed: string[] }> {
  await sodium.ready;

  const { data: publicKey } = await octokit.actions.getRepoPublicKey({
    owner,
    repo,
  });

  const installed: string[] = [];
  const failed: string[] = [];

  for (const secret of secrets) {
    try {
      const messageBytes = sodium.from_string(secret.value);
      const keyBytes = sodium.from_base64(
        publicKey.key,
        sodium.base64_variants.ORIGINAL,
      );
      const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
      const encryptedValue = sodium.to_base64(
        encryptedBytes,
        sodium.base64_variants.ORIGINAL,
      );

      await octokit.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: secret.name,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });

      installed.push(secret.name);
    } catch (err) {
      console.error(`시크릿 등록 실패 [${secret.name}]:`, err);
      failed.push(secret.name);
    }
  }

  return { installed, failed };
}
