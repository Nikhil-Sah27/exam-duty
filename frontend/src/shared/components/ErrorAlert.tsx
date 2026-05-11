interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <p className="mb-3 rounded bg-red-50 p-2 text-center text-sm text-red-600">
      {message}
    </p>
  );
}
