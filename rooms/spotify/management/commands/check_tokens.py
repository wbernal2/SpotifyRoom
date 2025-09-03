from django.core.management.base import BaseCommand
from spotify.models import SpotifyToken

class Command(BaseCommand):
    help = 'Check Spotify tokens in the database'

    def handle(self, *args, **options):
        tokens = SpotifyToken.objects.all()
        
        if not tokens:
            self.stdout.write(self.style.WARNING('No Spotify tokens found in the database.'))
            return
            
        self.stdout.write(self.style.SUCCESS(f'Found {tokens.count()} Spotify tokens:'))
        
        for token in tokens:
            self.stdout.write(f"User (session): {token.user}")
            self.stdout.write(f"Created at: {token.created_at}")
            self.stdout.write(f"Expires in: {token.expires_in}")
            self.stdout.write(f"Token type: {token.token_type}")
            self.stdout.write(f"Access token: {token.access_token[:10]}...{token.access_token[-10:] if len(token.access_token) > 20 else ''}")
            self.stdout.write(f"Refresh token: {token.refresh_token[:10]}...{token.refresh_token[-10:] if len(token.refresh_token) > 20 else ''}")
            self.stdout.write("-------------------------------------------")
