from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('./backend/.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

client = create_client(url, key)

# Get users
users = client.table('users').select('email, tier, subscription_status').execute()
print("Users in database:")
for user in users.data:
    email = user.get('email', 'N/A')
    tier = user.get('tier', 'N/A')
    status = user.get('subscription_status', 'N/A')
    print(f"  {email}: tier={tier}, status={status}")
