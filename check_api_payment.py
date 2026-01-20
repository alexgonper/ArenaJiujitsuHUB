
import requests
import json

try:
    response = requests.get('http://localhost:5000/api/v1/students/696ea84d6aa1df5c5e08e6d4/dashboard')
    data = response.json()
    
    if data.get('success'):
        payment_data = data['data']['payment']
        print(json.dumps(payment_data, indent=2))
        
        # Verify history length
        print(f"History Length: {len(payment_data.get('history', []))}")
    else:
        print("API returned success: false")
        print(data)

except Exception as e:
    print(f"Error: {e}")
