import Image from"next/image";

export function VeklomLogo() {
 return (
 <div className="flex items-center" aria-label="Veklom M2M Trust Infrastructure">
 <Image
 src="/images/veklom_logo_hex.jpg"
 alt="Veklom"
 width={200}
 height={56}
 priority
 className="h-12 w-auto object-contain"
 />
 </div>
 );
}
