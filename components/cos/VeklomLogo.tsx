import Image from "next/image";

export function VeklomLogo() {
  return (
    <Image
      src="/brand/veklom-logo.jpeg"
      alt="Veklom"
      width={152}
      height={42}
      className="h-9 w-auto rounded object-cover"
      priority
    />
  );
}
