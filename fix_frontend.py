import os

path = 'app/os/onboarding/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'const [certificateId, setCertificateId] = useState<string>("");',
    'const [certificateId, setCertificateId] = useState<string>("");\n  const [profilePglId, setProfilePglId] = useState<string>("");'
)

code = code.replace(
    'const certRes = await api<{ certificate_id: string }>(',
    'const certRes = await api<{ certificate_id: string; profile_pgl_id: string }>('
)

code = code.replace(
    'setCertificateId(certRes.certificate_id || "");',
    'setCertificateId(certRes.certificate_id || "");\n        setProfilePglId(certRes.profile_pgl_id || "");'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
