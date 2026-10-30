import { describe, expect, it } from "vitest";
import { buildMediaPath, detectImageType, isOwnMediaPath } from "./image";

const USER = "11111111-1111-4111-8111-111111111111";
const ID = "22222222-2222-4222-8222-222222222222";

function bytes(...values: number[]): Uint8Array {
  const b = new Uint8Array(16);
  b.set(values);
  return b;
}

describe("détection du format", () => {
  it("reconnaît JPEG, PNG et WebP par leur signature", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(detectImageType(webp)).toBe("image/webp");
  });

  it("refuse un fichier déguisé en image", () => {
    expect(detectImageType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(new Uint8Array(4))).toBeNull();
  });
});

describe("chemins de stockage", () => {
  it("préfixe toujours par l'utilisateur", () => {
    expect(buildMediaPath(USER, "meals", "image/jpeg", ID)).toBe(`${USER}/meals/${ID}.jpg`);
  });

  it("refuse un identifiant forgé", () => {
    expect(() => buildMediaPath("../../etc", "meals", "image/jpeg", ID)).toThrow(RangeError);
  });

  it("vérifie l'appartenance d'un chemin", () => {
    expect(isOwnMediaPath(USER, `${USER}/meals/${ID}.jpg`)).toBe(true);
    expect(isOwnMediaPath(USER, `${ID}/meals/x.jpg`)).toBe(false);
    expect(isOwnMediaPath(USER, `${USER}/../${ID}/x.jpg`)).toBe(false);
  });
});
