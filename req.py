import urllib.request, json
req = urllib.request.Request('http://lockerphycer-lockerphycer-api-1:8092/api/v1/workspace/')
req.add_header('Content-Type', 'application/json')
try:
    response = urllib.request.urlopen(req, json.dumps({'name': 'test', 'slug': 'test'}).encode('utf-8'))
    print(response.read().decode('utf-8'))
except Exception as e:
    print(e.read().decode('utf-8'))
