import argparse
import getpass
import sys

from sqlalchemy import func, select

from app.db import get_session_factory
from app.models import Admin
from app.security import hash_password

MIN_PASSWORD_LENGTH = 10


def create_admin(email: str, name: str, password: str) -> None:
    with get_session_factory()() as db:
        admin = db.scalars(select(Admin).where(func.lower(Admin.email) == email.lower())).first()
        if admin is None:
            db.add(Admin(email=email.lower(), name=name, password_hash=hash_password(password)))
            print(f"admin {email} created")
        else:
            admin.name = name
            admin.password_hash = hash_password(password)
            admin.is_active = True
            print(f"admin {email} updated")
        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-admin", help="create or reset an admin account")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    args = parser.parse_args()

    password = getpass.getpass("password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    if password != getpass.getpass("repeat password: "):
        sys.exit("passwords do not match")
    create_admin(args.email, args.name, password)


if __name__ == "__main__":
    main()
