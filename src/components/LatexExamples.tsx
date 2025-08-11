import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const LatexExamples: React.FC = () => {
  const examples = [
    {
      category: 'Basic Math',
      items: [
        { name: 'Fractions', latex: '\\frac{a}{b}' },
        { name: 'Square Root', latex: '\\sqrt{x}' },
        { name: 'Exponents', latex: 'x^2 + y^2 = z^2' },
        { name: 'Subscripts', latex: 'a_1 + a_2 + a_3 + \\ldots + a_n' }
      ]
    },
    {
      category: 'Algebra',
      items: [
        { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
        { name: 'Binomial Theorem', latex: '(x+y)^n = \\sum_{k=0}^{n} {n \\choose k} x^{n-k} y^k' },
        { name: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { name: 'Determinant', latex: '\\det\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc' }
      ]
    },
    {
      category: 'Calculus',
      items: [
        { name: 'Derivative', latex: '\\frac{d}{dx}f(x) = \\lim_{h \\to 0}\\frac{f(x+h) - f(x)}{h}' },
        { name: 'Integral', latex: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)' },
        { name: 'Partial Derivative', latex: '\\frac{\\partial^2 f}{\\partial x\\partial y}' },
        { name: 'Taylor Series', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n' }
      ]
    },
    {
      category: 'Physics',
      items: [
        { name: 'Einstein\'s Energy Equation', latex: 'E = mc^2' },
        { name: 'Newton\'s Second Law', latex: 'F = ma' },
        { name: 'Maxwell\'s Equations', latex: '\\nabla \\cdot E = \\frac{\\rho}{\\epsilon_0}' },
        { name: 'Schrödinger Equation', latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi' }
      ]
    },
    {
      category: 'Chemistry',
      items: [
        { name: 'Chemical Equation', latex: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O' },
        { name: 'Equilibrium Constant', latex: 'K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}' },
        { name: 'pH Equation', latex: 'pH = -\\log_{10}[H^+]' },
        { name: 'Arrhenius Equation', latex: 'k = Ae^{-E_a/RT}' }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">LaTeX Examples for Questions</h2>
      
      <div className="space-y-8">
        {examples.map((category, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">{item.name}</h4>
                  <div className="bg-gray-100 p-3 rounded-lg mb-3 flex items-center justify-center">
                    <BlockMath math={item.latex} />
                  </div>
                  <div className="bg-gray-100 p-2 rounded-lg font-mono text-sm overflow-x-auto">
                    {item.latex}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use LaTeX in Questions</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Click the <span className="font-serif italic">∑</span> button for inline math or <span className="font-serif italic">∫</span> for block math</li>
          <li>Enter your LaTeX expression in the modal</li>
          <li>Preview your expression to ensure it's correct</li>
          <li>Click "Insert" to add it to your question</li>
        </ol>
        <p className="mt-4 text-sm text-blue-700">
          For more advanced LaTeX syntax, refer to the <a href="https://katex.org/docs/supported.html" target="_blank" rel="noopener noreferrer" className="underline">KaTeX documentation</a>.
        </p>
      </div>
    </div>
  );
};

export default LatexExamples;