/**
 * JavaBox Starter Templates & Code Examples
 */

const JAVA_TEMPLATES = {
  'Main.java': {
    name: 'Main.java',
    path: 'Main.java',
    content: `public class Main {
    public static void main(String[] args) {
        System.out.println("==========================================");
        System.out.println("   Welcome to JavaBox Browser IDE 🚀");
        System.out.println("==========================================");
        
        int a = 15;
        int b = 27;
        int sum = a + b;
        
        System.out.println("Calculation Result: " + a + " + " + b + " = " + sum);
        
        // Loop demonstration
        System.out.println("Counting prime numbers up to 30:");
        for (int i = 2; i <= 30; i++) {
            if (isPrime(i)) {
                System.out.print(i + " ");
            }
        }
        System.out.println("");
        System.out.println("Ready to code! Select templates from sidebar.");
    }
    
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
}`
  },

  'ScannerDemo.java': {
    name: 'ScannerDemo.java',
    path: 'ScannerDemo.java',
    content: `import java.util.Scanner;

public class ScannerDemo {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("--- Interactive Scanner Input Demo ---");
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.print("Enter your age: ");
        int age = scanner.nextInt();
        
        System.out.println("Hello, " + name + "!");
        System.out.println("In 5 years, you will be " + (age + 5) + " years old.");
        
        if (age >= 18) {
            System.out.println("Status: Adult Developer 💻");
        } else {
            System.out.println("Status: Young Coder 🌟");
        }
        
        scanner.close();
    }
}`
  },

  'DataStructures.java': {
    name: 'DataStructures.java',
    path: 'DataStructures.java',
    content: `public class DataStructures {
    public static void main(String[] args) {
        System.out.println("=== Binary Search Tree Demo ===");
        BST tree = new BST();
        
        int[] values = {50, 30, 20, 40, 70, 60, 80};
        System.out.println("Inserting values into BST:");
        for (int val : values) {
            System.out.print(val + " ");
            tree.insert(val);
        }
        
        System.out.println("");
        System.out.println("In-order Traversal (Sorted output):");
        tree.inorder();
        System.out.println("");
        
        System.out.println("Searching for element 60: " + tree.search(60));
        System.out.println("Searching for element 99: " + tree.search(99));
    }
}

class Node {
    int key;
    Node left, right;
    
    public Node(int item) {
        key = item;
        left = right = null;
    }
}

class BST {
    Node root;
    
    public BST() {
        root = null;
    }
    
    public void insert(int key) {
        root = insertRec(root, key);
    }
    
    private Node insertRec(Node root, int key) {
        if (root == null) {
            root = new Node(key);
            return root;
        }
        if (key < root.key)
            root.left = insertRec(root.left, key);
        else if (key > root.key)
            root.right = insertRec(root.right, key);
        return root;
    }
    
    public void inorder() {
        inorderRec(root);
    }
    
    private void inorderRec(Node root) {
        if (root != null) {
            inorderRec(root.left);
            System.out.print(root.key + " ");
            inorderRec(root.right);
        }
    }
    
    public boolean search(int key) {
        return searchRec(root, key);
    }
    
    private boolean searchRec(Node root, int key) {
        if (root == null) return false;
        if (root.key == key) return true;
        return key < root.key ? searchRec(root.left, key) : searchRec(root.right, key);
    }
}`
  },

  'CanvasGraphics.java': {
    name: 'CanvasGraphics.java',
    path: 'CanvasGraphics.java',
    content: `// JavaBox Canvas 2D Graphics Demo
public class CanvasGraphics {
    public static void main(String[] args) {
        System.out.println("Rendering Java graphics demo to Canvas panel...");
        
        JavaCanvas canvas = new JavaCanvas(600, 400);
        canvas.clear("#0d1117");
        
        // Draw decorative background grid
        canvas.setStroke("#21262d", 1);
        for (int x = 0; x < 600; x += 30) {
            canvas.drawLine(x, 0, x, 400);
        }
        for (int y = 0; y < 400; y += 30) {
            canvas.drawLine(0, y, 600, y);
        }
        
        // Draw colorful circles (Bouncing Balls simulation state)
        String[] colors = {"#ff5555", "#50fa7b", "#8be9fd", "#bd93f9", "#ffb86c"};
        for (int i = 0; i < 25; i++) {
            int cx = (i * 47 + 30) % 560 + 20;
            int cy = (i * 31 + 40) % 340 + 30;
            int radius = (i % 5 + 2) * 8;
            String color = colors[i % colors.length];
            
            canvas.fillCircle(cx, cy, radius, color);
            canvas.setStroke("#ffffff", 2);
            canvas.drawCircle(cx, cy, radius);
        }
        
        // Render stylized Java Logo Text
        canvas.drawText("JavaBox 2D Graphics Engine", 150, 360, "bold 22px Inter, sans-serif", "#f8f8f2");
        canvas.drawText("Rendered pure in-browser without backend JVM", 140, 385, "14px Inter, sans-serif", "#6272a4");
        
        System.out.println("Graphics rendered successfully! Switch to the 'Canvas Screen' tab to view.");
    }
}`
  },

  'OOPDemo.java': {
    name: 'OOPDemo.java',
    path: 'OOPDemo.java',
    content: `// Demonstration of Interfaces, Inheritance & Polymorphism
public class OOPDemo {
    public static void main(String[] args) {
        System.out.println("=== Java Polymorphism Showcase ===");
        
        Shape[] shapes = new Shape[] {
            new Circle(5.0),
            new Rectangle(4.0, 6.0),
            new Triangle(3.0, 8.0)
        };
        
        double totalArea = 0;
        for (Shape s : shapes) {
            System.out.println(s.getName() + " -> Area: " + String.format("%.2f", s.calculateArea()));
            totalArea += s.calculateArea();
        }
        
        System.out.println("-----------------------------------");
        System.out.println("Total Combined Area: " + String.format("%.2f", totalArea));
    }
}

interface Shape {
    double calculateArea();
    String getName();
}

class Circle implements Shape {
    private double radius;
    
    public Circle(double r) {
        this.radius = r;
    }
    
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
    
    public String getName() {
        return "Circle (r=" + radius + ")";
    }
}

class Rectangle implements Shape {
    private double width, height;
    
    public Rectangle(double w, double h) {
        this.width = w;
        this.height = h;
    }
    
    public double calculateArea() {
        return width * height;
    }
    
    public String getName() {
        return "Rectangle (" + width + "x" + height + ")";
    }
}

class Triangle implements Shape {
    private double base, height;
    
    public Triangle(double b, double h) {
        this.base = b;
        this.height = h;
    }
    
    public double calculateArea() {
        return 0.5 * base * height;
    }
    
    public String getName() {
        return "Triangle (b=" + base + ", h=" + height + ")";
    }
}`
  },

  'JUnitTests.java': {
    name: 'JUnitTests.java',
    path: 'JUnitTests.java',
    content: `// JavaBox JUnit Test Runner Example
public class JUnitTests {
    
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static String reverse(String str) {
        if (str == null) return null;
        StringBuilder sb = new StringBuilder(str);
        return sb.reverse().toString();
    }
    
    public static void main(String[] args) {
        System.out.println("=== Executing Unit Test Suite ===");
        
        int passed = 0;
        int failed = 0;
        
        // Test 1: Addition
        if (assertEquals(15, add(7, 8), "testAddition")) passed++; else failed++;
        
        // Test 2: String Reversal
        if (assertEquals("xobaVaJ", reverse("JaVabox"), "testStringReversal")) passed++; else failed++;
        
        // Test 3: Edge Case Null Reversal
        if (assertEquals(null, reverse(null), "testNullReversal")) passed++; else failed++;
        
        // Test 4: Int Overflow handling
        if (assertEquals(0, add(0, 0), "testZeroAddition")) passed++; else failed++;
        
        System.out.println("----------------------------------");
        System.out.println("Test Summary: " + passed + " Passed, " + failed + " Failed.");
        if (failed == 0) {
            System.out.println("RESULT: ALL TESTS PASSED ✅");
        } else {
            System.out.println("RESULT: SOME TESTS FAILED ❌");
        }
    }
    
    private static boolean assertEquals(Object expected, Object actual, String testName) {
        boolean match = (expected == null && actual == null) || (expected != null && expected.equals(actual));
        if (match) {
            System.out.println("[PASS] " + testName);
            return true;
        } else {
            System.out.println("[FAIL] " + testName + " - Expected: " + expected + ", Got: " + actual);
            return false;
        }
    }
}`
  }
};
