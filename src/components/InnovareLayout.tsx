import { ReactNode } from "react";
import InnovareSidebar from "./InnovareSidebar";
import InnovareTopbar from "./InnovareTopbar";

interface InnovareLayoutProps {
  children: ReactNode;
}

const InnovareLayout = ({ children }: InnovareLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <InnovareSidebar />
      <InnovareTopbar />
      <main className="ml-16 mt-14 p-6">
        {children}
      </main>
    </div>
  );
};

export default InnovareLayout;
